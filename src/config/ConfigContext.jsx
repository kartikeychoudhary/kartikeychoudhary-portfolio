import { createContext, useContext } from "react";
import envConfig from "@env";

const ConfigContext = createContext(envConfig);

export function ConfigProvider({ value, children }) {
  return (
    <ConfigContext.Provider value={value || envConfig}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}

export { envConfig };
