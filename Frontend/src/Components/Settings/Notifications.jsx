import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Toggle from "./Toggle";

export default function Notifications() {
  const { t } = useTranslation();
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [weekNotif, setWeekNotif] = useState(true);

  return (
    <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7]">
      <h2 className="text-xl font-semibold mb-10">{t("notifications")}</h2>

      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-lg">{t("emailAlerts")}</span>
          <p className="text-xs">{t("emailAlertsDesc")}</p>
        </div>
        <Toggle enabled={emailNotif} setEnabled={setEmailNotif} />
      </div>

      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-lg">{t("pushNotifications")}</span>
          <p className="text-xs">{t("pushNotificationsDesc")}</p>
        </div>
        <Toggle enabled={pushNotif} setEnabled={setPushNotif} />
      </div>

      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-lg">{t("weeklyReports")}</span>
          <p className="text-xs">{t("weeklyReportsDesc")}</p>
        </div>
        <Toggle enabled={weekNotif} setEnabled={setWeekNotif} />
      </div>
    </div>
  );
}