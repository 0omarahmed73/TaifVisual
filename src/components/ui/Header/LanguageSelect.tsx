import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SettingsRow } from "./SettingsRow";

function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(
    i18n.language.split("-")[0].toString(),
  );

  //Change language
  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
    document.body.dir = i18n.dir();
  }, [language, i18n]);

  return (
    <SettingsRow
      icon={<Languages />}
      title={t("header.settings.language")}
      description={t("header.settings.languageDesc")}
      htmlFor="settings-language"
    >
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value)}
        dir={i18n.dir()}
      >
        <SelectTrigger id="settings-language" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ar">العربية</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="pt">Português</SelectItem>
        </SelectContent>
      </Select>
    </SettingsRow>
  );
}

export default LanguageSelect;
