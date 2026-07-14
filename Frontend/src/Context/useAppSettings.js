import { useContext } from "react";
import AppSettingsContext from "./AppSettingsContext";

const useAppSettings = () => useContext(AppSettingsContext);

export default useAppSettings;