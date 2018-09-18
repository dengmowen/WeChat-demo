//app.js
// 引入工具类库
import util from './utils/index.js';
App({
  // 小程序初始化
  onLaunch: function () {
    console.log('app init....');
    this.getDevideInfo();
    // 增加初始化缓存数据功能
    util.getStorageData('visited', (data)=>{
      // console.log('缓存数据-', data);
      this.globalData.visitedArticles = data;
    });
  },
  // 小程序全局数据
  globalData:{
    user: {
      openId: null,
      name: '',
      avator: ''
    },
    visitedArticles: '', // 保存已阅读文章
    deviceInfo: {} // 设备信息
  },
  getDevideInfo() {
    let self = this;
    wx.getSystemInfo({
      success: function(res) {
        console.log('设备信息-', res);
        self.globalData.getDevideInfo = res;
      },
    })
  }
})