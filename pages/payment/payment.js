/**
 * @file payment.js
 * @author rabbit77
 */
/* globals Page, swan */
Page({
    data: {
        title: 'requestPolymerPayment',
        orderList: []
    },

    requestPolymerPayment(e) {
        // 创建订单
        swan.request({
            url: getApp().getUrl('/pay/gen'),
            success: res => {
                let data = res.data;
                let orderList = this.data.orderList;
                if (data.code !== 0) {
                    console.log('create order err', data);
                    return;
                }
                // 调起支付
                swan.requestPolymerPayment({
                    orderInfo: data.data,
                    bannedChannels: this.getData('bannedChannels'),
                    success: res => {
                        swan.showToast({
                            title: '支付成功',
                            icon: 'success'
                        });
                        data.data.paymentStatus = true;
                        orderList.unshift(data.data);
                        this.setData({
                            orderList: orderList
                        });
                    },
                    fail: err => {
                        swan.showToast({
                            title: err.errMsg,
                            icon: 'none'
                        });
                        data.data.paymentStatus = false;
                        orderList.unshift(data.data);
                        this.setData({
                            orderList: orderList
                        });
                    }
                });
            },
            fail: err => {
                swan.showToast({
                    title: '订单创建失败',
                    icon: 'none'
                });
                console.log('create order fail', err);
            }
        });
    },
    refund(e) {
        // 申请退款
        let tpOrderId = e.target.dataset.tpOrderId || '';
        let index = e.target.dataset.index;
        let orderList = this.data.orderList;
        swan.request({
            url: getApp().getUrl('/pay/refund'),
            data: {
                tp_order_id: tpOrderId
            },
            success: res => {
                swan.showModal({
                    content: JSON.stringify(res.data)
                })
                orderList[index].refundDetail = res.data.msg;
                this.setData({
                    orderList
                })
            },
            fail: err => {
                orderList[index].refundDetail = err.data.msg;
                this.setData({
                    orderList
                })
            }
        })
    },
    inquiry(e) {
        // 查看订单详情
        let index = e.target.dataset.index;
        let orderList = this.data.orderList;
        let tpOrderId = e.target.dataset.tpOrderId || '';
        swan.request({
            url: getApp().getUrl('/pay/status'),
            data: {
                tp_order_id: tpOrderId
            },
            success: res => {
                swan.showModal({
                    content: JSON.stringify(res.data)
                })
                orderList[index].orderDetail = res.data.msg;
                this.setData({
                    orderList
                })
            },
            fail: err => {
                orderList[index].orderDetail = err.data.msg;
                this.setData({
                    orderList
                })
            }
        })
    }
});
