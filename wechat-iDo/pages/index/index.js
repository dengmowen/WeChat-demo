'use strict';
import util from '../../utils/index';
import config from '../../utils/config';
let app = getApp();
let isDEV = config.isDev;
Page({
  data: {
    page: 1, //当前加载第几页的数据
    days: 3,
    pageSize: 4,
    totalSize: 0,
    hasMore: true, // 判断是否显示没有数据提示
    articleList: [], // 存放文章列表数据，与视图相关联
    defaultImg: config.defaultImg,
    hiddenLoading: false // 是否隐藏loading
  },
  onLoad: function(options) {
    // 生命周期函数--监听页面加载
    this.setData({
      hiddenLoading: false
    });
    this.requestArticle();
  },
  onReachBottom() {
    // 触发下拉刷新列表
    if (this.data.hasMore) {
      let nextPage = this.data.page + 1;
      this.setData({
        page: nextPage
      });
      this.requestArticle();
    }
  },
  onShareAppMessage() {
    // 分享功能
    let title = config.defaultShareText || ''
    return {
      title: title,
      path: '/pages/index/index',
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  requestArticle() {
    util.request({
        url: 'list',
        mock: true,
        data: {
          tag: '微信热门',
          start: this.data.page || 1,
          days: this.data.days || 3,
          pageSize: this.data.pageSize,
          langs: config.appLang || 'en'
        }
      })
      .then(res => {
        if (res && res.status === 0 && res.data && res.data.length) {
          // 数据返回正常
          // console.log(res);
          let articleData = res.data;
          //格式化原始数据
          let formatData = this.formatArticleData(articleData);
          // 重新加载数据
          this.renderArticle(formatData);
          // console.log(formatData);
        } else if (this.data.page === 1 && res.data && res.data.length === 0) {
          // 如果加载第一页就没有数据，说明数据存在异常情况
          util.alert();
          this.setData({
            hasMore: false
          })
        } else if (this.data.page !== 1 && res.data && res.data.length === 0) {
          // 如果非第一页没有数据，那说明没有数据了，停用下拉加载功能即可
          this.setData({
            hasMore: false
          });
        } else {
          /*
           * 返回异常错误
           * 展示后端返回的错误信息，并设置下拉加载功能不可用
           */
          util.alert('提示', res);
          this.setData({
            hasMore: false
          });
          return null;
        }
      });
  },
  // 格式化文章列表数据
  formatArticleData(data) {
    let formatData = undefined;
    if (data && data.length) {
      formatData = data.map((group) => {
        // 格式化日期
        group.formateDate = this.dateConvert(group.date);
        if (group && group.articles) {
          let formatArticleItems = group.articles.map((item) => {
            // 判断是否已经访问过
            item.hasVisited = this.isVisited(item.contentId);
            return item;
          }) || [];
          group.articles = formatArticleItems;
        }
        return group
      })
    }
    return formatData;
  },
  /*  将原始日期字符串格式化 '2017-06-12' return '今日' / 08-21 / 2017-06-12 */
  dateConvert(dateStr) {
    if (!dateStr) {
      return '';
    }
    let today = new Date(),
      todayYear = today.getFullYear(),
      todayMonth = ('0' + (today.getMonth() + 1)).slice(-2),
      todayDay = ('0' + today.getDate()).slice(-2);
    let convertStr = '';
    let originYear = +dateStr.slice(0, 4);
    let todayFormat = `${todayYear}-${todayMonth}-${todayDay}`;
    if (dateStr === todayFormat) {
      convertStr = '今日';
    } else if (originYear < todayYear) {
      let splitStr = dateStr.split('-');
      convertStr = `${splitStr[0]}年${splitStr[1]}月${splitStr[2]}日`;
    } else {
      convertStr = dateStr.slice(5).replace('-', '月') + '日'
    }
    return convertStr;
  },
  /* 判断文章是否访问过  @param contentId */
  isVisited(contentId) {
    let visitedArticles = app.globalData && app.globalData.visitedArticles || '';
    return visitedArticles.indexOf(`${contentId}`) > -1;
  },
  renderArticle(data) {
    // 重载格式化数据
    if (data && data.length) {
      let newList = this.data.articleList.concat(data);
      if (newList.length > 3) {
        // 控制无限加载次数
        this.setData({
          hasMore: false
        });
      } else {
        this.setData({
          articleList: newList,
          hiddenLoading: true
        });
      }
    }
  },
  showDetail(e) {
    // 点击文章查看详情
    let dataset = e.currentTarget.dataset;
    let item = dataset && dataset.item;
    let contentId = item.contentId || 0;
    // 调用实现阅读标识的函数
    this.markRead(contentId);
    wx.navigateTo({
      url: `../detail/detail?contentId=${contentId}`,
    });
  },
  markRead(contentId) {
    // console.log(contentId);
    //先从缓存中查找 visited 字段对应的所有文章 contentId 数据
    util.getStorageData('visited', (data) => {
      let newStorage = data;
      // console.log('data--', data);
      if (data) {
        //如果当前的文章 contentId 不存在，也就是还没有阅读，就把当前的文章 contentId 拼接进去
        if (data.indexOf(contentId) === -1) {
          newStorage = `${data},${contentId}`;
        }
      } else {
        // 如果还没有阅读 visited 的数据，那说明当前的文章是用户阅读的第一篇，直接赋值就行了 
        newStorage = `${contentId}`;
      }
      /*
       * 处理过后，如果 data(老数据) 与 newStorage(新数据) 不一样，说明阅读记录发生了变化
       * 不一样的话，我们就需要把新的记录重新存入缓存和 globalData 中 
       */
      if (data !== newStorage) {
        if (app.globalData) {
          app.globalData.visitedArticles = newStorage;
        }
        util.setStorageData('visited', newStorage, () => {
          this.resetArticles();
        });
      }
      // console.log(newStorage);
    });
  },
  resetArticles() {
    // 重新处理数据 
    let old = this.data.articleList;
    let newArticles = this.formatArticleData(old);
    // console.log(newArticles);
    this.setData({
      articleList: newArticles
    });
  }
});