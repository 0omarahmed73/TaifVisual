use image::{ImageReader};  
use image::codecs::{png::{PngEncoder, CompressionType, FilterType}, jpeg::JpegEncoder, webp::WebPEncoder};  
use std::fs::File;  
use std::io::BufWriter;  
use std::path::Path;  

#[tauri::command]  
async fn compress_image(input_path: String, output_path: String, quality: String) -> Result<String, String> {  
    let img = ImageReader::open(&input_path)  
        .map_err(|_| "inputFileErr".to_string())?  
        .decode()  
        .map_err(|_| "inputFileErr".to_string())?;  
      
    let output_path_obj = Path::new(&output_path);  
    let extension = output_path_obj.extension()  
        .and_then(|ext| ext.to_str())  
        .ok_or("invalidFormatErr")?  
        .to_lowercase();  
      
    let file = File::create(&output_path)  
        .map_err(|_| "outputFileErr".to_string())?;  
      
    match extension.as_str() {  
        "png" => {  
            let mut writer = BufWriter::new(file);  
            let compression_type = match quality.as_str() {  
                "90" => CompressionType::Fast,    
                "60" => CompressionType::Default, 
                "30" => CompressionType::Best,    
                _ => CompressionType::Default,    
            };  
            let encoder = PngEncoder::new_with_quality(  
                &mut writer,  
                compression_type,  
                FilterType::Adaptive  
            );  
            img.write_with_encoder(encoder)  
                .map_err(|_| "inputFileErr".to_string())?;  
        },  
        "jpg" | "jpeg" => {  
            let mut writer = BufWriter::new(file);  
            let jpeg_quality = quality.parse::<u8>()
            .map_err(|_| "unknownErr".to_string())?;  
            let encoder = JpegEncoder::new_with_quality(&mut writer, jpeg_quality);  
            img.write_with_encoder(encoder)  
                .map_err(|_| "inputFileErr".to_string())?;  
        },  
        "webp" => {  
            let encoder = WebPEncoder::new_lossless(file);  
            let rgba_img = img.to_rgba8();  
            encoder.encode(  
                &rgba_img,  
                img.width(),  
                img.height(),  
                image::ExtendedColorType::Rgba8  
            ).map_err(|_| "inputFileErr".to_string())?;  
        },  
        _ => return Err("invalidFormatErr".to_string())  
    }  
      
    Ok(format!("Image compressed successfully to {}", output_path))  
}

/// Folder the Spleeter sidecar must be started from: it resolves `models/2stems`
/// relative to its working directory, and installed builds ship the model next
/// to the app executable. Returns None when no model sits there (dev builds,
/// where the project folder already works, and Android).
#[tauri::command]
fn spleeter_cwd() -> Option<String> {
    let dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    dir.join("models").join("2stems").is_dir().then(|| dir.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init());

    // The updater only exists on desktop targets.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .invoke_handler(tauri::generate_handler![compress_image, spleeter_cwd])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
