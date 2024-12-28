// API 配置
const config = {
    // 開發環境
    development: {
        apiUrl: 'http://localhost:10000'
    },
    // 生產環境
    production: {
        apiUrl: 'https://coffee-github-io.onrender.com'
    }
};

// 根據當前環境選擇配置
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const currentConfig = config[environment];

export default currentConfig;
