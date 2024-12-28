// API 配置
const config = {
    // 開發環境
    development: {
        apiUrl: 'http://localhost:3002'
    },
    // 生產環境
    production: {
        apiUrl: 'https://你的render域名.onrender.com'  // 這裡需要替換成你的 Render 域名
    }
};

// 根據當前環境選擇配置
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const currentConfig = config[environment];

export default currentConfig;
