import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import "antd/dist/reset.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: "#1A73E8",
        borderRadius: 14,
        fontSize: 14,
        controlHeight: 36,
      },
      components: {
        Card: { headerFontSize: 14 },
        Table: { headerBorderRadius: 12 },
      },
    }}
  >
    <App />
  </ConfigProvider>
  // </React.StrictMode>
);