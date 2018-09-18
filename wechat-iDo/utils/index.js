'user strict'
// import Promise from '../lib/promise'
import config from './config'
import * as Mock from './mock.js'
// 格式化时间
const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n;
}
// 请求参数 设置默认值方便调用
const DEFAULT_REQUEST_OPTIONS = {
  url: '',
  data: {},
  header: {
    "Content-Type": "application/json"
  },
  method: 'GET',
  dataType: 'json'
}
let util = {
  formatTime: formatTime,
  isDEV: config.isDev,
  // 环境配置为dev环境，则打印参数内容
  log() {
    this.isDEV && console.log(...arguments);
  },
  // 封装 alert 弹出窗口
  alert(title = '提示', content = config.defaultAlertMsg) {
    if ('object' === typeof content) {
      content = this.isDEV && JSON.stringify(content) || config.defaultAlertMsg;
    }
    wx.showModal({
      title: title,
      content: content
    });
  },
  // 封装本地缓存数据的读取功能
  getStorageData(key, cb) {
    let self = this;
    // 将数据存储在本地缓存中指定的 key 中，会覆盖掉原来该 key 对应的内容，这是一个异步接
    wx.getStorage({
      key: key,
      success(res) {
        cb && cb(res.data);
      },
      fail(err) {
        let msg = err.errMsg || '';
        if (/getStorage:fail/.test(msg)) {
          self.setStorageData(key)
        }
      }
    })
  },
  setStorageData(key, value = '', cb) {
    wx.setStorage({
      key: key,
      data: value,
      success() {
        cb && cb();
      }
    })
  },
  request(opt) {
    // let { url, data, header, method, dataType } = opt
    // let self = this
    let options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, opt);
    let { url, data, header, method, dataType, mock = false } = options;
    let self = this;
    // 调用后本地mock.js
    return new Promise((resolve, reject) => {
      if (mock) {
        let res = {
          statusCode: 200,
          data: Mock[url]
        };
        if (res && res.statusCode == 200 && res.data) {
          resolve(res.data);
        } else {
          self.alert('提示', res);
          reject(res);
        }
      } else {
        wx.request({
          url: url,
          data: data,
          header: header,
          method: method,
          dataType: dataType,
          success: function (res) {
            if (res && res.statusCode == 200 && res.data) {
              resolve(res.data);
            } else {
              self.alert('提示', res);
              reject(res);
            }
          },
          fail: function (err) {
            self.log(err);
            self.alert('提示', err);
            reject(err);
          }
        })
      }
    })
    // 网络请求
    // return new Promise((resolve, reject) => {
    //   wx.request({
    //     url: url,
    //     data: data,
    //     header: header,
    //     method: method,
    //     dataType: dataType,
    //     success: function (res) {
    //       if (res && res.statusCode == 200 && res.data) {
    //         resolve(res.data);
    //       } else {
    //         self.alert('提示', res);
    //         reject(res);
    //       }
    //     },
    //     fail: function (err) {
    //       self.log(err);
    //       self.alert('提示', err);
    //       reject(err);
    //     }
    //   })
    // })
  }
};
export default util;