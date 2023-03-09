/**
 * cron 30 21 * * * jd_bean_change.js
 */
const Env = require('./common/Env')
const $ = new Env('京东资产变动');
const notify = $.isNode() ? require('./sendNotify') : '';
const JXUserAgent = $.isNode() ? (process.env.JX_USER_AGENT ? process.env.JX_USER_AGENT : ``) : ``;
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let NowHour = new Date().getHours();

//默认开启缓存模式
let checkbeanDetailMode=1;
if ($.isNode() && process.env.BEANCHANGE_BEANDETAILMODE){
    checkbeanDetailMode=process.env.BEANCHANGE_BEANDETAILMODE*1;
}

const fs = require('fs');

// hermanwu 加载一对一推送
let isnewql = fs.existsSync('/ql/data/config/auth.json');
let strCKFile="";
let strUidFile ="";
if(isnewql){
    strCKFile = '/ql/data/scripts/CKName_cache.json';
    strUidFile = '/ql/data/scripts/CK_WxPusherUid.json';
}else{
    strCKFile = '/ql/scripts/CKName_cache.json';
    strUidFile = '/ql/scripts/CK_WxPusherUid.json';
}

let Fileexists2 = fs.existsSync(strCKFile);
let TempCK = [];
if (Fileexists2) {
    console.log("检测到别名缓存文件CKName_cache.json，载入...");
    TempCK = fs.readFileSync(strCKFile, 'utf-8');
    if (TempCK) {
        TempCK = TempCK.toString();
        TempCK = JSON.parse(TempCK);
    }
}

let UidFileexists = fs.existsSync(strUidFile);
let TempCKUid = [];
if (UidFileexists) {
    console.log("检测到一对一Uid文件WxPusherUid.json，载入...");
    TempCKUid = fs.readFileSync(strUidFile, 'utf-8');
    if (TempCKUid) {
        TempCKUid = TempCKUid.toString();
        TempCKUid = JSON.parse(TempCKUid);
    }
}

let matchtitle="昨日";
let yesterday="";
let TodayDate="";
let startDate="";
let endDate="";
try {
    const moment = require("moment");
    yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    TodayDate = moment().format("YYYY-MM-DD");
    startDate = moment().startOf("month").format("YYYY_MM");
    endDate = moment().endOf("month").format("YYYY-MM-DD");
} catch (e) {
    console.log("依赖缺失，请先安装依赖moment!");
    return
}

if (!fs.existsSync("./BeanCache")) {
    fs.mkdirSync("./BeanCache");
}

let strBeanCache = "./BeanCache/" + yesterday + ".json";
let strNewBeanCache = "./BeanCache/" + TodayDate + ".json";
let TodayCache = [];
let Fileexists = fs.existsSync(strBeanCache);
let TempBeanCache = [];
if(!Fileexists){
    yesterday=TodayDate;
    strBeanCache=strNewBeanCache;
    Fileexists = fs.existsSync(strBeanCache);
    matchtitle="今日";
}
if (Fileexists) {
    console.log("检测到资产变动缓存文件"+yesterday+".json，载入...");
    TempBeanCache = fs.readFileSync(strBeanCache, 'utf-8');
    if (TempBeanCache) {
        TempBeanCache = TempBeanCache.toString();
        TempBeanCache = JSON.parse(TempBeanCache);
    }
}

Fileexists = fs.existsSync(strNewBeanCache);
if (Fileexists) {
    console.log("检测到资产变动缓存文件"+TodayDate+".json，载入...");
    TodayCache = fs.readFileSync(strNewBeanCache, 'utf-8');
    if (TodayCache) {
        TodayCache = TodayCache.toString();
        TodayCache = JSON.parse(TodayCache);
    }
}


let allMessage = '';
let allMessage2 = '';
let allReceiveMessage = '';
let allWarnMessage = '';
let ReturnMessage = '';
let ReturnMessageMonth = '';
let allMessageMonth = '';

let MessageUserGp2 = '';
let ReceiveMessageGp2 = '';
let WarnMessageGp2 = '';
let allMessageGp2 = '';
let allMessage2Gp2 = '';
let allMessageMonthGp2 = '';
let IndexGp2 = 0;

let MessageUserGp3 = '';
let ReceiveMessageGp3 = '';
let WarnMessageGp3 = '';
let allMessageGp3 = '';
let allMessage2Gp3 = '';
let allMessageMonthGp3 = '';
let IndexGp3 = 0;

let MessageUserGp4 = '';
let ReceiveMessageGp4 = '';
let WarnMessageGp4 = '';
let allMessageGp4 = '';
let allMessageMonthGp4 = '';
let allMessage2Gp4 = '';
let IndexGp4 = 0;

let notifySkipList = "";
let IndexAll = 0;
let EnableMonth = "false";
let isSignError = false;
let ReturnMessageTitle="";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let intPerSent = 0;
let i = 0;
let llShowMonth = false;
let Today = new Date();
let strAllNotify="";
let strSubNotify="";
let llPetError=false;
let strGuoqi="";
let RemainMessage = '\n';
RemainMessage += "⭕活动攻略:⭕" + '\n';
RemainMessage += '【点点券】京东->首页领券->中间位置瓜分点点券的签到->再领价值XXX的红包\n';
RemainMessage += '【特价金币】京东特价版->我的->金币(特价版使用)\n';
RemainMessage += '【京东赚赚】微信->京东赚赚小程序->底部赚好礼->提现无门槛红包(京东使用)\n';
RemainMessage += '【领现金】京东->搜索领现金(微信提现+京东红包)\n';
RemainMessage += '【东东农场】京东->我的->东东农场,完成是京东红包,可以用于京东app的任意商品\n';
RemainMessage += '【京东金融】京东金融app->我的->养猪猪,完成是白条支付券,支付方式选白条支付时立减.\n';
RemainMessage += '【其他】京喜红包只能在京喜使用,其他同理';

let WP_APP_TOKEN_ONE = "";
let WP_APP_NOT_NOTIFY_PINS = [];
let WP_APP_COMBINE_NOTIFY = false;
let WP_UID_PINS = {};

let TempBaipiao = "";
let llgeterror=false;

let doExJxBeans ="false";
let time = new Date().getHours();
if ($.isNode()) {
    if (process.env.WP_APP_TOKEN_ONE) {
        WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE;
    }
    // hermanwu加载配置
    if (process.env.WP_APP_NOT_NOTIFY_PINS) {
        WP_APP_NOT_NOTIFY_PINS = process.env.WP_APP_NOT_NOTIFY_PINS.split("&");
    }
    if (process.env.WP_APP_COMBINE_NOTIFY) {
        WP_APP_COMBINE_NOTIFY = process.env.WP_APP_COMBINE_NOTIFY;
    }
    /* if(process.env.BEANCHANGE_ExJxBeans=="true"){
        if (time >= 17){
            console.log(`检测到设定了临期京豆转换喜豆...`);
            doExJxBeans = process.env.BEANCHANGE_ExJxBeans;
        } else{
            console.log(`检测到设定了临期京豆转换喜豆,但时间未到17点后，暂不执行转换...`);
        }
    } */
}
if(WP_APP_TOKEN_ONE) {
    console.log(`检测到已配置Wxpusher的Token，启用一对一推送...`);
    if(!WP_APP_COMBINE_NOTIFY) {
        // hermanwu提示可以开启合并推送
        console.log(`设置WP_APP_COMBINE_NOTIFY="true"，开启同uid合并推送`);
    }
} else{
    console.log(`检测到未配置Wxpusher的Token，禁用一对一推送...`);
}
if ($.isNode() && process.env.BEANCHANGE_PERSENT) {
    intPerSent = parseInt(process.env.BEANCHANGE_PERSENT);
    console.log(`检测到设定了分段通知:` + intPerSent);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP2) {
    MessageUserGp2 = process.env.BEANCHANGE_USERGP2 ? process.env.BEANCHANGE_USERGP2.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送2,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP3) {
    MessageUserGp3 = process.env.BEANCHANGE_USERGP3 ? process.env.BEANCHANGE_USERGP3.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送3,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP4) {
    MessageUserGp4 = process.env.BEANCHANGE_USERGP4 ? process.env.BEANCHANGE_USERGP4.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送4,将禁用分段通知`);
}

//取消月结查询
//if ($.isNode() && process.env.BEANCHANGE_ENABLEMONTH) {
//EnableMonth = process.env.BEANCHANGE_ENABLEMONTH;
//}

if ($.isNode() && process.env.BEANCHANGE_SUBNOTIFY) {
    strSubNotify=process.env.BEANCHANGE_SUBNOTIFY;
    strSubNotify+="\n";
    console.log(`检测到预览置顶内容,将在一对一推送的预览显示...\n`);
}

if ($.isNode() && process.env.BEANCHANGE_ALLNOTIFY) {
    strAllNotify=process.env.BEANCHANGE_ALLNOTIFY;
    console.log(`检测到设定了公告,将在推送信息中置顶显示...`);
    strAllNotify = `【✨✨✨✨公告✨✨✨✨】\n`+strAllNotify;
    console.log(strAllNotify+"\n");
    strAllNotify +=`\n🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏`
}


if (EnableMonth == "true" && Today.getDate() == 1 && Today.getHours() > 17)
    llShowMonth = true;

let userIndex2 = -1;
let userIndex3 = -1;
let userIndex4 = -1;


let decExBean=0;

if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false')
        console.log = () => {};
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

//查询开关
let strDisableList = "";
let DisableIndex=-1;
if ($.isNode()) {
    strDisableList = process.env.BEANCHANGE_DISABLELIST ? process.env.BEANCHANGE_DISABLELIST.split('&') : [];
}

//喜豆查询
let EnableJxBeans=true;
DisableIndex=strDisableList.findIndex((item) => item === "喜豆查询");
if(DisableIndex!=-1){
    console.log("检测到设定关闭喜豆查询");
    EnableJxBeans=false
}

//汪汪乐园
let EnableJoyPark=false;
/* DisableIndex = strDisableList.findIndex((item) => item === "汪汪乐园");
if(DisableIndex!=-1){
	console.log("检测到设定关闭汪汪乐园查询");
	EnableJoyPark=false
} */

//京东赚赚
let EnableJdZZ=true;
DisableIndex = strDisableList.findIndex((item) => item === "京东赚赚");
if(DisableIndex!=-1){
    console.log("检测到设定关闭京东赚赚查询");
    EnableJdZZ=false;
}

//东东农场
let EnableJdFruit=true;
DisableIndex = strDisableList.findIndex((item) => item === "东东农场");
if(DisableIndex!=-1){
    console.log("检测到设定关闭东东农场查询");
    EnableJdFruit=false;
}

//特价金币
let EnableJdSpeed=true;
DisableIndex = strDisableList.findIndex((item) => item === "极速金币");
if(DisableIndex!=-1){
    console.log("检测到设定关闭特价金币查询");
    EnableJdSpeed=false;
}

//京喜牧场
let EnableJxMC=true;
DisableIndex= strDisableList.findIndex((item) => item === "京喜牧场");
if(DisableIndex!=-1){
    console.log("检测到设定关闭京喜牧场查询");
    EnableJxMC=false;
}

// 京东工厂
let EnableJDGC=true;
DisableIndex=strDisableList.findIndex((item) => item === "京东工厂");
if(DisableIndex!=-1){
    console.log("检测到设定关闭京东工厂查询");
    EnableJDGC=false;
}
//领现金
let EnableCash=true;
DisableIndex=strDisableList.findIndex((item) => item === "领现金");
if(DisableIndex!=-1){
    console.log("检测到设定关闭领现金查询");
    EnableCash=false;
}

//金融养猪
let EnablePigPet=false;
DisableIndex=strDisableList.findIndex((item) => item === "金融养猪");
if(DisableIndex!=-1){
    console.log("检测到设定关闭金融养猪查询");
    EnablePigPet=false;
}

//7天过期京豆
let EnableOverBean=true;
DisableIndex=strDisableList.findIndex((item) => item === "过期京豆");
if(DisableIndex!=-1){
    console.log("检测到设定关闭过期京豆查询");
    EnableOverBean=false
}

//查优惠券
let EnableChaQuan=true;
DisableIndex=strDisableList.findIndex((item) => item === "查优惠券");
if(DisableIndex!=-1){
    console.log("检测到设定关闭优惠券查询");
    EnableChaQuan=false
}

DisableIndex=strDisableList.findIndex((item) => item === "活动攻略");
if(DisableIndex!=-1){
    console.log("检测到设定关闭活动攻略显示");
    RemainMessage="";
}

//汪汪赛跑
let EnableJoyRun=true;
DisableIndex=strDisableList.findIndex((item) => item === "汪汪赛跑");
if(DisableIndex!=-1){
    console.log("检测到设定关闭汪汪赛跑查询");
    EnableJoyRun=false
}

//京豆收益查询
let EnableCheckBean=true;
DisableIndex=strDisableList.findIndex((item) => item === "京豆收益");
if(DisableIndex!=-1){
    console.log("检测到设定关闭京豆收益查询");
    EnableCheckBean=false
}

!(async() => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
            "open-url": "https://bean.m.jd.com/bean/signIndex.action"
        });
        return;
    }
    for (i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.pt_pin = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
            $.index = i + 1;
            $.beanCount = 0;
            $.incomeBean = 0;
            $.expenseBean = 0;
            $.todayIncomeBean = 0;
            $.todayOutcomeBean = 0;
            $.errorMsg = '';
            $.isLogin = true;
            $.nickName = '';
            $.levelName = '';
            $.message = '';
            $.balance = 0;
            $.expiredBalance = 0;
            $.JdzzNum = 0;
            $.JdMsScore = 0;
            $.JdFarmProdName = '';
            $.JdtreeEnergy = 0;
            $.JdtreeTotalEnergy = 0;
            $.treeState = 0;
            $.JdwaterTotalT = 0;
            $.JdwaterD = 0;
            $.JDwaterEveryDayT = 0;
            $.JDtotalcash = 0;
            $.JDEggcnt = 0;
            $.Jxmctoken = '';
            $.DdFactoryReceive = '';
            $.jxFactoryInfo = '';
            $.jxFactoryReceive = '';
            $.jdCash = 0;
            $.isPlusVip = false;
            $.isRealNameAuth = false;
            $.JingXiang = "";
            $.allincomeBean = 0; //月收入
            $.allexpenseBean = 0; //月支出
            $.joylevel = 0;
            $.beanChangeXi=0;
            $.inJxBean=0;
            $.OutJxBean=0;
            $.todayinJxBean=0;
            $.todayOutJxBean=0;
            $.xibeanCount = 0;
            $.PigPet = '';
            $.YunFeiTitle="";
            $.YunFeiQuan = 0;
            $.YunFeiQuanEndTime = "";
            $.YunFeiTitle2="";
            $.YunFeiQuan2 = 0;
            $.YunFeiQuanEndTime2 = "";
            $.JoyRunningAmount = "";
            $.ECardinfo = "";
            $.PlustotalScore=0;
            $.CheckTime="";
            $.beanCache=0;

            // hermanwu 跳过配置ck
            if (WP_APP_NOT_NOTIFY_PINS.indexOf($.pt_pin) != -1) {
                console.log("已在WP_APP_NOT_NOTIFY_PINS中配置【"+$.pt_pin+"】，跳过不执行\n");
                continue;
            }

            TempBaipiao = "";
            strGuoqi="";
            console.log(`******开始查询【京东账号${$.index}】${$.nickName || $.UserName}*********`);
            await TotalBean();
            //await TotalBean2();
            if ($.beanCount == 0) {
                console.log("数据获取失败，等待30秒后重试....")
                await $.wait(30*1000);
                await TotalBean();
            }
            if ($.beanCount == 0) {
                console.log("疑似获取失败,等待10秒后用第二个接口试试....")
                await $.wait(10*1000);
                var userdata = await getuserinfo();
                if (userdata.code == 1) {
                    $.beanCount = userdata.content.jdBean;
                }
            }


            if (!$.isLogin) {
                await isLoginByX1a0He();
            }
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
                    "open-url": "https://bean.m.jd.com/bean/signIndex.action"
                });

                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }

            if (TempBeanCache) {
                for (let j = 0; j < TempBeanCache.length; j++) {
                    if (TempBeanCache[j].pt_pin == $.UserName) {
                        $.CheckTime = TempBeanCache[j].CheckTime;
                        $.beanCache = TempBeanCache[j].BeanNum;
                        break;
                    }
                }
            }

            var llfound = false;
            var timeString = "";
            var nowHour = new Date().getHours();
            var nowMinute = new Date().getMinutes();
            if (nowHour < 10)
                timeString += "0" + nowHour + ":";
            else
                timeString += nowHour + ":";

            if (nowMinute < 10)
                timeString += "0" + nowMinute;
            else
                timeString += nowMinute;

            if (TodayCache) {
                for (let j = 0; j < TodayCache.length; j++) {
                    if (TodayCache[j].pt_pin == $.UserName) {
                        TodayCache[j].CheckTime = timeString;
                        TodayCache[j].BeanNum = $.beanCount;
                        llfound = true;
                        break;
                    }
                }
            }
            if (!llfound) {

                var tempAddCache = {
                    "pt_pin": $.UserName,
                    "CheckTime": timeString,
                    "BeanNum": $.beanCount
                };
                TodayCache.push(tempAddCache);
            }

            await getjdfruitinfo(); //东东农场
            await $.wait(1000);

            await Promise.all([
                getJoyBaseInfo(), //汪汪乐园
                getJdZZ(), //京东赚赚
                cash(), //特价金币
                jdJxMCinfo(), //京喜牧场
                bean(), //京豆查询
                getDdFactoryInfo(), // 京东工厂
                jdCash(), //领现金
                GetJxBeaninfo(), //喜豆查询
                GetPigPetInfo(), //金融养猪
                GetJoyRuninginfo(), //汪汪赛跑
                queryScores()
            ])

            await showMsg();
            if (intPerSent > 0) {
                if ((i + 1) % intPerSent == 0) {
                    console.log("分段通知条件达成，处理发送通知....");
                    if ($.isNode() && allMessage) {
                        var TempMessage=allMessage;
                        if(strAllNotify)
                            allMessage=strAllNotify+`\n`+allMessage;

                        await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                        }, '\n\n本通知 By ccwav Mod',TempMessage)
                    }
                    if ($.isNode() && allMessageMonth) {
                        await notify.sendNotify(`京东月资产变动`, `${allMessageMonth}`, {
                            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                        })
                    }
                    allMessage = "";
                    allMessageMonth = "";
                }

            }
        }
    }

    var str = JSON.stringify(TodayCache, null, 2);
    fs.writeFile(strNewBeanCache, str, function (err) {
        if (err) {
            console.log(err);
            console.log("添加缓存" + TodayDate + ".json失败!");
        } else {
            console.log("添加缓存" + TodayDate + ".json成功!");
        }
    })

    //组1通知
    if (ReceiveMessageGp4) {
        allMessage2Gp4 = `【⏰商品白嫖活动领取提醒⏰】\n` + ReceiveMessageGp4;
    }
    if (WarnMessageGp4) {
        if (allMessage2Gp4) {
            allMessage2Gp4 = `\n` + allMessage2Gp4;
        }
        allMessage2Gp4 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp4 + allMessage2Gp4;
    }

    //组2通知
    if (ReceiveMessageGp2) {
        allMessage2Gp2 = `【⏰商品白嫖活动领取提醒⏰】\n` + ReceiveMessageGp2;
    }
    if (WarnMessageGp2) {
        if (allMessage2Gp2) {
            allMessage2Gp2 = `\n` + allMessage2Gp2;
        }
        allMessage2Gp2 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp2 + allMessage2Gp2;
    }

    //组3通知
    if (ReceiveMessageGp3) {
        allMessage2Gp3 = `【⏰商品白嫖活动领取提醒⏰】\n` + ReceiveMessageGp3;
    }
    if (WarnMessageGp3) {
        if (allMessage2Gp3) {
            allMessage2Gp3 = `\n` + allMessage2Gp3;
        }
        allMessage2Gp3 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp3 + allMessage2Gp3;
    }

    //其他通知
    if (allReceiveMessage) {
        allMessage2 = `【⏰商品白嫖活动领取提醒⏰】\n` + allReceiveMessage;
    }
    if (allWarnMessage) {
        if (allMessage2) {
            allMessage2 = `\n` + allMessage2;
        }
        allMessage2 = `【⏰商品白嫖活动任务提醒⏰】\n` + allWarnMessage + allMessage2;
    }

    if (intPerSent > 0) {
        //console.log("分段通知还剩下" + cookiesArr.length % intPerSent + "个账号需要发送...");
        if (allMessage || allMessageMonth) {
            console.log("分段通知收尾，处理发送通知....");
            if ($.isNode() && allMessage) {
                var TempMessage=allMessage;
                if(strAllNotify)
                    allMessage=strAllNotify+`\n`+allMessage;

                await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                    url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                }, '\n\n本通知 By ccwav Mod',TempMessage)
            }
            if ($.isNode() && allMessageMonth) {
                await notify.sendNotify(`京东月资产变动`, `${allMessageMonth}`, {
                    url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
                })
            }
        }
    } else {

        if ($.isNode() && allMessageGp2) {
            var TempMessage=allMessageGp2;
            if(strAllNotify)
                allMessageGp2=strAllNotify+`\n`+allMessageGp2;
            await notify.sendNotify(`${$.name}#2`, `${allMessageGp2}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, '\n\n本通知 By ccwav Mod',TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp3) {
            var TempMessage=allMessageGp3;
            if(strAllNotify)
                allMessageGp3=strAllNotify+`\n`+allMessageGp3;
            await notify.sendNotify(`${$.name}#3`, `${allMessageGp3}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, '\n\n本通知 By ccwav Mod',TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp4) {
            var TempMessage=allMessageGp4;
            if(strAllNotify)
                allMessageGp4=strAllNotify+`\n`+allMessageGp4;
            await notify.sendNotify(`${$.name}#4`, `${allMessageGp4}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, '\n\n本通知 By ccwav Mod',TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessage) {
            var TempMessage=allMessage;
            if(strAllNotify)
                allMessage=strAllNotify+`\n`+allMessage;

            await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            }, '\n\n本通知 By ccwav Mod',TempMessage)
            await $.wait(10 * 1000);
        }

        if ($.isNode() && allMessageMonthGp2) {
            await notify.sendNotify(`京东月资产变动#2`, `${allMessageMonthGp2}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp3) {
            await notify.sendNotify(`京东月资产变动#3`, `${allMessageMonthGp3}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp4) {
            await notify.sendNotify(`京东月资产变动#4`, `${allMessageMonthGp4}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonth) {
            await notify.sendNotify(`京东月资产变动`, `${allMessageMonth}`, {
                url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
            })
            await $.wait(10 * 1000);
        }
    }

    if ($.isNode() && allMessage2Gp2) {
        allMessage2Gp2 += RemainMessage;
        await notify.sendNotify("京东白嫖榜#2", `${allMessage2Gp2}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp3) {
        allMessage2Gp3 += RemainMessage;
        await notify.sendNotify("京东白嫖榜#3", `${allMessage2Gp3}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp4) {
        allMessage2Gp4 += RemainMessage;
        await notify.sendNotify("京东白嫖榜#4", `${allMessage2Gp4}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2) {
        allMessage2 += RemainMessage;
        await notify.sendNotify("京东白嫖榜", `${allMessage2}`, {
            url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`
        })
        await $.wait(10 * 1000);
    }

    // hermanwu 分组合并推送
    if (Object.keys(WP_UID_PINS).length > 0) {
        console.log('按Uid分组合并推送：')
        // console.log(JSON.stringify(WP_UID_PINS))
        for (const key in WP_UID_PINS) {
            if (Object.hasOwnProperty.call(WP_UID_PINS, key)) {
                const pins = WP_UID_PINS[key];
                let pt_pin = '';
                let allMsg = {
                    title: '',
                    msg: '',
                    author: '\n\n本通知 By Herman Wu',
                    summary: ''
                };
                for (let index = 0; index < pins.length; index++) {
                    const pin = pins[index];
                    allMsg.title = pin.title;
                    allMsg.msg += pin.msg + '\n\n\n\n';
                    allMsg.summary += pin.summary + '\n\n\n\n';
                    pt_pin = pin.pt_pin;
                }
                console.log('合并后：', JSON.stringify(allMsg))
                await notify.sendNotifybyWxPucher(allMsg.title, `${allMsg.msg}`, `${pt_pin}`,`${allMsg.author}`,allMsg.summary);
            }
        }
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })
async function showMsg() {
    //if ($.errorMsg)
    //return
    ReturnMessageTitle="";
    ReturnMessage = "";
    var strsummary="";
    if (MessageUserGp2) {
        userIndex2 = MessageUserGp2.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp3) {
        userIndex3 = MessageUserGp3.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp4) {
        userIndex4 = MessageUserGp4.findIndex((item) => item === $.pt_pin);
    }

    if (userIndex2 != -1) {
        IndexGp2 += 1;
        ReturnMessageTitle = `【账号${IndexGp2}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex3 != -1) {
        IndexGp3 += 1;
        ReturnMessageTitle = `【账号${IndexGp3}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex4 != -1) {
        IndexGp4 += 1;
        ReturnMessageTitle = `【账号${IndexGp4}🆔】${$.nickName || $.UserName}`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        IndexAll += 1;
        ReturnMessageTitle = `【账号${IndexAll}🆔】${$.nickName || $.UserName}`;
    }


    if ($.JingXiang) {
        if ($.isRealNameAuth)
            if (cookie.includes("app_open"))
                ReturnMessageTitle += `(wskey已实名)\n`;
            else
                ReturnMessageTitle += `(已实名)\n`;
        else
        if (cookie.includes("app_open"))
            ReturnMessageTitle += `(wskey未实名)\n`;
        else
            ReturnMessageTitle += `(未实名)\n`;

        ReturnMessage += `【账号信息】`;
        if ($.isPlusVip) {
            ReturnMessage += `Plus会员`;
            if ($.PlustotalScore)
                ReturnMessage += `(${$.PlustotalScore}分)`
        } else {
            ReturnMessage += `普通会员`;
        }
        ReturnMessage += `,京享值${$.JingXiang}\n`;
    }else{
        ReturnMessageTitle+= `\n`;
    }
    if (llShowMonth) {
        ReturnMessageMonth = ReturnMessage;
        ReturnMessageMonth += `\n【上月收入】：${$.allincomeBean}京豆 🐶\n`;
        ReturnMessageMonth += `【上月支出】：${$.allexpenseBean}京豆 🐶\n`;

        console.log(ReturnMessageMonth);

        if (userIndex2 != -1) {
            allMessageMonthGp2 += ReturnMessageMonth + `\n`;
        }
        if (userIndex3 != -1) {
            allMessageMonthGp3 += ReturnMessageMonth + `\n`;
        }
        if (userIndex4 != -1) {
            allMessageMonthGp4 += ReturnMessageMonth + `\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allMessageMonth += ReturnMessageMonth + `\n`;
        }
        if ($.isNode() && WP_APP_TOKEN_ONE) {
            await notify.sendNotifybyWxPucher("京东月资产变动", `${ReturnMessageMonth}`, `${$.UserName}`);
        }

    }
    if (EnableCheckBean) {
        if (checkbeanDetailMode == 0) {
            ReturnMessage += `【今日京豆】收${$.todayIncomeBean}豆`;
            strsummary += `【今日京豆】收${$.todayIncomeBean}豆`;
            if ($.todayOutcomeBean != 0) {
                ReturnMessage += `,支${$.todayOutcomeBean}豆`;
                strsummary += `,支${$.todayOutcomeBean}豆`;
            }
            ReturnMessage += `\n`;
            strsummary += `\n`;
            ReturnMessage += `【昨日京豆】收${$.incomeBean}豆`;

            if ($.expenseBean != 0) {
                ReturnMessage += `,支${$.expenseBean}豆`;
            }
            ReturnMessage += `\n`;
        } else {
            if (TempBeanCache){
                ReturnMessage += `【京豆变动】${$.beanCount-$.beanCache}豆(与${matchtitle}${$.CheckTime}比较)`;
                strsummary += `【京豆变动】${$.beanCount-$.beanCache}豆(与${matchtitle}${$.CheckTime}比较)`;
                ReturnMessage += `\n`;
                strsummary += `\n`;
            }
            else{
                ReturnMessage += `【京豆变动】未找到缓存,下次出结果统计`;
                strsummary += `【京豆变动】未找到缓存,下次出结果统计`;
                ReturnMessage += `\n`;
                strsummary += `\n`;
            }
        }
    }


    if ($.beanCount){
        ReturnMessage += `【当前京豆】${$.beanCount-$.beanChangeXi}豆(≈${(($.beanCount-$.beanChangeXi)/ 100).toFixed(2)}元)\n`;
        strsummary+= `【当前京豆】${$.beanCount-$.beanChangeXi}豆(≈${(($.beanCount-$.beanChangeXi)/ 100).toFixed(2)}元)\n`;
    } else {
        if($.levelName || $.JingXiang)
            ReturnMessage += `【当前京豆】获取失败,接口返回空数据\n`;
        else{
            ReturnMessage += `【当前京豆】${$.beanCount-$.beanChangeXi}豆(≈${(($.beanCount-$.beanChangeXi)/ 100).toFixed(2)}元)\n`;
            strsummary += `【当前京豆】${$.beanCount-$.beanChangeXi}豆(≈${(($.beanCount-$.beanChangeXi)/ 100).toFixed(2)}元)\n`;
        }
    }

    if (EnableJxBeans) {
        if ($.todayinJxBean || $.todayOutJxBean) {
            ReturnMessage += `【今日喜豆】收${$.todayinJxBean}豆`;
            if ($.todayOutJxBean != 0) {
                ReturnMessage += `,支${$.todayOutJxBean}豆`;
            }
            ReturnMessage += `\n`;
        }
        if ($.inJxBean || $.OutJxBean) {
            ReturnMessage += `【昨日喜豆】收${$.inJxBean}豆`;
            if ($.OutJxBean != 0) {
                ReturnMessage += `,支${$.OutJxBean}豆`;
            }
            ReturnMessage += `\n`;
        }
        ReturnMessage += `【当前喜豆】${$.xibeanCount}喜豆(≈${($.xibeanCount/ 100).toFixed(2)}元)\n`;
        strsummary += `【当前喜豆】${$.xibeanCount}豆(≈${($.xibeanCount/ 100).toFixed(2)}元)\n`;
    }


    if ($.JDEggcnt) {
        ReturnMessage += `【京喜牧场】${$.JDEggcnt}枚鸡蛋\n`;
    }
    if ($.JDtotalcash) {
        ReturnMessage += `【特价金币】${$.JDtotalcash}币(≈${($.JDtotalcash / 10000).toFixed(2)}元)\n`;
    }
    if ($.JdzzNum) {
        ReturnMessage += `【京东赚赚】${$.JdzzNum}币(≈${($.JdzzNum / 10000).toFixed(2)}元)\n`;
    }
    if ($.JdMsScore != 0) {
        ReturnMessage += `【京东秒杀】${$.JdMsScore}币(≈${($.JdMsScore / 1000).toFixed(2)}元)\n`;
    }
    if($.ECardinfo)
        ReturnMessage += `【礼卡余额】${$.ECardinfo}\n`;

    if ($.joylevel || $.jdCash || $.JoyRunningAmount) {
        ReturnMessage += `【其他信息】`;
        if ($.joylevel) {
            ReturnMessage += `汪汪:${$.joylevel}级`;
        }
        if ($.jdCash) {
            if ($.joylevel) {
                ReturnMessage += ",";
            }
            ReturnMessage += `领现金:${$.jdCash}元`;
        }
        if ($.JoyRunningAmount) {
            if ($.joylevel || $.jdCash) {
                ReturnMessage += ",";
            }
            ReturnMessage += `汪汪赛跑:${$.JoyRunningAmount}元`;
        }

        ReturnMessage += `\n`;

    }

    if ($.JdFarmProdName != "") {
        if ($.JdtreeEnergy != 0) {
            if ($.treeState === 2 || $.treeState === 3) {
                ReturnMessage += `【东东农场】${$.JdFarmProdName} 可以兑换了!\n`;
                TempBaipiao += `【东东农场】${$.JdFarmProdName} 可以兑换了!\n`;
                if (userIndex2 != -1) {
                    ReceiveMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】${$.JdFarmProdName} (东东农场)\n`;
                }
                if (userIndex3 != -1) {
                    ReceiveMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】${$.JdFarmProdName} (东东农场)\n`;
                }
                if (userIndex4 != -1) {
                    ReceiveMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】${$.JdFarmProdName} (东东农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】${$.JdFarmProdName} (东东农场)\n`;
                }
            } else {
                if ($.JdwaterD != 'Infinity' && $.JdwaterD != '-Infinity') {
                    ReturnMessage += `【东东农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%,${$.JdwaterD}天)\n`;
                } else {
                    ReturnMessage += `【东东农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%)\n`;

                }
            }
        } else {
            if ($.treeState === 0) {
                TempBaipiao += `【东东农场】水果领取后未重新种植!\n`;

                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】水果领取后未重新种植! (东东农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】水果领取后未重新种植! (东东农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】水果领取后未重新种植! (东东农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】水果领取后未重新种植! (东东农场)\n`;
                }

            } else if ($.treeState === 1) {
                ReturnMessage += `【东东农场】${$.JdFarmProdName}种植中...\n`;
            } else {
                TempBaipiao += `【东东农场】状态异常!\n`;
                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】状态异常! (东东农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】状态异常! (东东农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】状态异常! (东东农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】状态异常! (东东农场)\n`;
                }
                //ReturnMessage += `【东东农场】${$.JdFarmProdName}状态异常${$.treeState}...\n`;
            }
        }
    }
    if ($.jxFactoryInfo) {
        ReturnMessage += `【京喜工厂】${$.jxFactoryInfo}\n`
    }
    if ($.ddFactoryInfo) {
        ReturnMessage += `【东东工厂】${$.ddFactoryInfo}\n`
    }
    if ($.DdFactoryReceive) {
        if (userIndex2 != -1) {
            ReceiveMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】${$.DdFactoryReceive} (东东工厂)\n`;
        }
        if (userIndex3 != -1) {
            ReceiveMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】${$.DdFactoryReceive} (东东工厂)\n`;
        }
        if (userIndex4 != -1) {
            ReceiveMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】${$.DdFactoryReceive} (东东工厂)\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】${$.DdFactoryReceive} (东东工厂)\n`;
        }
        TempBaipiao += `【东东工厂】${$.ddFactoryInfo} 可以兑换了!\n`;
    }
    if ($.jxFactoryReceive) {
        if (userIndex2 != -1) {
            ReceiveMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】${$.jxFactoryReceive} (京喜工厂)\n`;
        }
        if (userIndex3 != -1) {
            ReceiveMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】${$.jxFactoryReceive} (京喜工厂)\n`;
        }
        if (userIndex4 != -1) {
            ReceiveMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】${$.jxFactoryReceive} (京喜工厂)\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】${$.jxFactoryReceive} (京喜工厂)\n`;
        }

        TempBaipiao += `【京喜工厂】${$.jxFactoryReceive} 可以兑换了!\n`;

    }

    if ($.PigPet) {
        if (userIndex2 != -1) {
            ReceiveMessageGp2 += `【账号${IndexGp2} ${$.nickName || $.UserName}】${$.PigPet} (金融养猪)\n`;
        }
        if (userIndex3 != -1) {
            ReceiveMessageGp3 += `【账号${IndexGp3} ${$.nickName || $.UserName}】${$.PigPet} (金融养猪)\n`;
        }
        if (userIndex4 != -1) {
            ReceiveMessageGp4 += `【账号${IndexGp4} ${$.nickName || $.UserName}】${$.PigPet} (金融养猪)\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allReceiveMessage += `【账号${IndexAll} ${$.nickName || $.UserName}】${$.PigPet} (金融养猪)\n`;
        }

        TempBaipiao += `【金融养猪】${$.PigPet} 可以兑换了!\n`;

    }

    if(strGuoqi){
        ReturnMessage += `💸💸💸临期京豆明细💸💸💸\n`;
        ReturnMessage += `${strGuoqi}`;
    }
    ReturnMessage += `🧧🧧🧧红包明细🧧🧧🧧\n`;
    ReturnMessage += `${$.message}`;
    strsummary +=`${$.message}`;

    if($.YunFeiQuan){
        var strTempYF="【免运费券】"+$.YunFeiQuan+"张";
        if($.YunFeiQuanEndTime)
            strTempYF+="(有效期至"+$.YunFeiQuanEndTime+")";
        strTempYF+="\n";
        ReturnMessage +=strTempYF
        strsummary +=strTempYF;
    }
    if($.YunFeiQuan2){
        var strTempYF2="【免运费券】"+$.YunFeiQuan2+"张";
        if($.YunFeiQuanEndTime2)
            strTempYF+="(有效期至"+$.YunFeiQuanEndTime2+")";
        strTempYF2+="\n";
        ReturnMessage +=strTempYF2
        strsummary +=strTempYF2;
    }

    if (userIndex2 != -1) {
        allMessageGp2 += ReturnMessageTitle+ReturnMessage + `\n`;
    }
    if (userIndex3 != -1) {
        allMessageGp3 += ReturnMessageTitle+ReturnMessage + `\n`;
    }
    if (userIndex4 != -1) {
        allMessageGp4 += ReturnMessageTitle+ReturnMessage + `\n`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        allMessage += ReturnMessageTitle+ReturnMessage + `\n`;
    }

    console.log(`${ReturnMessageTitle+ReturnMessage}`);

    if ($.isNode() && WP_APP_TOKEN_ONE) {
        var strTitle="京东资产变动";
        if($.JingXiang){
            if ($.isRealNameAuth)
                if (cookie.includes("app_open"))
                    ReturnMessage=`【账号名称】${$.nickName || $.UserName}(wskey已实名)\n`+ReturnMessage;
                else
                    ReturnMessage=`【账号名称】${$.nickName || $.UserName}(已实名)\n`+ReturnMessage;
            else
            if (cookie.includes("app_open"))
                ReturnMessage=`【账号名称】${$.nickName || $.UserName}(wskey未实名)\n`+ReturnMessage;
            else
                ReturnMessage=`【账号名称】${$.nickName || $.UserName}(未实名)\n`+ReturnMessage;

        }else{
            ReturnMessage=`【账号名称】${$.nickName || $.UserName}\n`+ReturnMessage;
        }
        if (TempBaipiao) {
            strsummary=strSubNotify+TempBaipiao +strsummary;
            TempBaipiao = `【⏰商品白嫖活动提醒⏰】\n` + TempBaipiao;
            ReturnMessage = TempBaipiao + `\n` + ReturnMessage;
        } else {
            strsummary = strSubNotify + strsummary;
        }

        ReturnMessage += RemainMessage;

        if(strAllNotify)
            ReturnMessage=strAllNotify+`\n`+ReturnMessage;

        // hermanwu 分组合并推送
        if (WP_APP_COMBINE_NOTIFY) {
            // 同Uid合并推送
            const uid = getuuid("", $.UserName)
            console.log('查找uid： ', $.UserName, uid)
            if(!WP_UID_PINS[uid]) {
                WP_UID_PINS[uid] = []
            }
            WP_UID_PINS[uid].push({
                pt_pin: $.UserName,
                title: strTitle,
                msg: ReturnMessage,
                author: '\n\n本通知 By Herman Wu',
                summary: strsummary
            })
        } else {

            await notify.sendNotifybyWxPucher(strTitle, `${ReturnMessage}`, `${$.UserName}`,'\n\n本通知 By ccwav Mod',strsummary);
        }
    }

    //$.msg($.name, '', ReturnMessage , {"open-url": "https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean"});
}
// hermanwu
function getuuid(strRemark, PtPin) {
    var strTempuuid = "";
    if (strRemark) {
        var Tempindex = strRemark.indexOf("@@");
        if (Tempindex != -1) {
            console.log(PtPin + ": 检测到NVJDC的一对一格式,瑞思拜~!");
            var TempRemarkList = strRemark.split("@@");
            for (let j = 1; j < TempRemarkList.length; j++) {
                if (TempRemarkList[j]) {
                    if (TempRemarkList[j].length > 4) {
                        if (TempRemarkList[j].substring(0, 4) == "UID_") {
                            strTempuuid = TempRemarkList[j];
                            break;
                        }
                    }
                }
            }
            if (!strTempuuid) {
                console.log("检索资料失败...");
            }
        }
    }
    if (!strTempuuid && TempCKUid) {
        console.log("正在从CK_WxPusherUid文件中检索资料...");
        for (let j = 0; j < TempCKUid.length; j++) {
            if (PtPin == decodeURIComponent(TempCKUid[j].pt_pin)) {
                strTempuuid = TempCKUid[j].Uid;
                break;
            }
        }
    }
    return strTempuuid;
}

async function bean() {

    if (EnableCheckBean && checkbeanDetailMode==0) {

        // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
        // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
        // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000

        //前一天的0:0:0时间戳
        const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000);
        // 今天0:0:0时间戳
        const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
        let page = 1,
            t = 0,
            yesterdayArr = [],
            todayArr = [];
        do {
            let response = await getJingBeanBalanceDetail(page);
            await $.wait(1000);
            // console.log(`第${page}页: ${JSON.stringify(response)}`);
            if (response && response.code === "0") {
                page++;
                let detailList = response.jingDetailList;
                if (detailList && detailList.length > 0) {
                    for (let item of detailList) {
                        const date = item.date.replace(/-/g, '/') + "+08:00";
                        if (new Date(date).getTime() >= tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            todayArr.push(item);
                        } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            //昨日的
                            yesterdayArr.push(item);
                        } else if (tm > new Date(date).getTime()) {
                            //前天的
                            t = 1;
                            break;
                        }
                    }
                } else {
                    $.errorMsg = `数据异常`;
                    $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                    t = 1;
                }
            } else if (response && response.code === "3") {
                console.log(`cookie已过期，或者填写不规范，跳出`)
                t = 1;
            } else {
                console.log(`未知情况：${JSON.stringify(response)}`);
                console.log(`未知情况，跳出`)
                t = 1;
            }
        } while (t === 0);
        for (let item of yesterdayArr) {
            if (Number(item.amount) > 0) {
                $.incomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.expenseBean += Number(item.amount);
            }
        }
        for (let item of todayArr) {
            if (Number(item.amount) > 0) {
                $.todayIncomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.todayOutcomeBean += Number(item.amount);
            }
        }
        $.todayOutcomeBean = -$.todayOutcomeBean;
        $.expenseBean = -$.expenseBean;
    }
    decExBean = 0;
    if (EnableOverBean) {
        await queryexpirejingdou(); //过期京豆
        if (decExBean && doExJxBeans == "true") {
            var jxbeans = await exchangejxbeans(decExBean);
            if (jxbeans) {
                $.beanChangeXi = decExBean;
                console.log(`已为您将` + decExBean + `临期京豆转换成喜豆！`);
                strGuoqi += `已为您将` + decExBean + `临期京豆转换成喜豆！\n`;
            }
        }
    }
    await redPacket();
    if (EnableChaQuan)
        await getCoupon();
}

async function Monthbean() {
    let time = new Date();
    let year = time.getFullYear();
    let month = parseInt(time.getMonth()); //取上个月
    if (month == 0) {
        //一月份，取去年12月，所以月份=12，年份减1
        month = 12;
        year -= 1;
    }

    //开始时间 时间戳
    let start = new Date(year + "-" + month + "-01 00:00:00").getTime();
    console.log(`计算月京豆起始日期:` + GetDateTime(new Date(year + "-" + month + "-01 00:00:00")));

    //结束时间 时间戳
    if (month == 12) {
        //取去年12月，进1个月，所以月份=1，年份加1
        month = 1;
        year += 1;
    }
    let end = new Date(year + "-" + (month + 1) + "-01 00:00:00").getTime();
    console.log(`计算月京豆结束日期:` + GetDateTime(new Date(year + "-" + (month + 1) + "-01 00:00:00")));

    let allpage = 1,
        allt = 0,
        allyesterdayArr = [];
    do {
        let response = await getJingBeanBalanceDetail(allpage);
        await $.wait(1000);
        // console.log(`第${allpage}页: ${JSON.stringify(response)}`);
        if (response && response.code === "0") {
            allpage++;
            let detailList = response.jingDetailList;
            if (detailList && detailList.length > 0) {
                for (let item of detailList) {
                    const date = item.date.replace(/-/g, '/') + "+08:00";
                    if (start <= new Date(date).getTime() && new Date(date).getTime() < end) {
                        //日期区间内的京豆记录
                        allyesterdayArr.push(item);
                    } else if (start > new Date(date).getTime()) {
                        //前天的
                        allt = 1;
                        break;
                    }
                }
            } else {
                $.errorMsg = `数据异常`;
                $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                allt = 1;
            }
        } else if (response && response.code === "3") {
            console.log(`cookie已过期，或者填写不规范，跳出`)
            allt = 1;
        } else {
            console.log(`未知情况：${JSON.stringify(response)}`);
            console.log(`未知情况，跳出`)
            allt = 1;
        }
    } while (allt === 0);

    for (let item of allyesterdayArr) {
        if (Number(item.amount) > 0) {
            $.allincomeBean += Number(item.amount);
        } else if (Number(item.amount) < 0) {
            $.allexpenseBean += Number(item.amount);
        }
    }

}

async function jdJxMCinfo(){
    if (EnableJxMC) {
        llgeterror = false;
        await requestAlgo();
        if (llgeterror) {
            console.log(`等待10秒后再次尝试...`)
            await $.wait(10 * 1000);
            await requestAlgo();
        }
        await JxmcGetRequest();
    }
    return;
}

async function jdCash() {
    if (!EnableCash)
        return;
    let functionId = "cash_homePage";
    let sign = `body=%7B%7D&build=167968&client=apple&clientVersion=10.4.0&d_brand=apple&d_model=iPhone13%2C3&ef=1&eid=eidI25488122a6s9Uqq6qodtQx6rgQhFlHkaE1KqvCRbzRnPZgP/93P%2BzfeY8nyrCw1FMzlQ1pE4X9JdmFEYKWdd1VxutadX0iJ6xedL%2BVBrSHCeDGV1&ep=%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22screen%22%3A%22CJO3CMeyDJCy%22%2C%22osVersion%22%3A%22CJUkDK%3D%3D%22%2C%22openudid%22%3A%22CJSmCWU0DNYnYtS0DtGmCJY0YJcmDwCmYJC0DNHwZNc5ZQU2DJc3Zq%3D%3D%22%2C%22area%22%3A%22CJZpCJCmC180ENcnCv80ENc1EK%3D%3D%22%2C%22uuid%22%3A%22aQf1ZRdxb2r4ovZ1EJZhcxYlVNZSZz09%22%7D%2C%22ts%22%3A1648428189%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D&ext=%7B%22prstate%22%3A%220%22%2C%22pvcStu%22%3A%221%22%7D&isBackground=N&joycious=104&lang=zh_CN&networkType=3g&networklibtype=JDNetworkBaseAF&partner=apple&rfs=0000&scope=11&sign=98c0ea91318ef1313786d86d832f1d4d&st=1648428208392&sv=101&uemps=0-0&uts=0f31TVRjBSv7E8yLFU2g86XnPdLdKKyuazYDek9RnAdkKCbH50GbhlCSab3I2jwM04d75h5qDPiLMTl0I3dvlb3OFGnqX9NrfHUwDOpTEaxACTwWl6n//EOFSpqtKDhg%2BvlR1wAh0RSZ3J87iAf36Ce6nonmQvQAva7GoJM9Nbtdah0dgzXboUL2m5YqrJ1hWoxhCecLcrUWWbHTyAY3Rw%3D%3D`
    return new Promise((resolve) => {
        $.post(apptaskUrl(functionId, sign), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`jdCash API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data);
                        if (data.code === 0 && data.data.result) {
                            $.jdCash = data.data.result.totalMoney || 0;
                            return
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data);
            }
        })
    })
}

function apptaskUrl(functionId = "", body = "") {
    return {
        url: `${JD_API_HOST}?functionId=${functionId}`,
        body,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': '',
            'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
            'Accept-Language': 'zh-Hans-CN;q=1',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 10000
    }
}
function getSign(functionId, body) {
    return new Promise(async resolve => {
        let data = {
            functionId,
            body: JSON.stringify(body),
            "client":"apple",
            "clientVersion":"10.3.0"
        }
        let HostArr = ['jdsign.cf', 'signer.nz.lu']
        let Host = HostArr[Math.floor((Math.random() * HostArr.length))]
        let options = {
            url: `https://cdn.nz.lu/ddo`,
            body: JSON.stringify(data),
            headers: {
                Host,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
            },
            timeout: 30 * 1000
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(JSON.stringify(err))
                    console.log(`${$.name} getSign API请求失败，请检查网路重试`)
                } else {

                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
/* function TotalBean() {
	return new Promise(async resolve => {
		const options = {
			url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
			headers: {
				Cookie: cookie,
				"User-Agent": "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
			},
			timeout: 10000
		}
		$.get(options, (err, resp, data) => {
			try {
				if (err) {
					$.logErr(err)
				} else {
					console.log(data);
					if (data) {
						data = JSON.parse(data);
						if (data['retcode'] === "1001") {
							$.isLogin = false; //cookie过期
							return;
						}
						if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
							$.nickName = data.data.userInfo.baseInfo.nickname;
							$.levelName = data.data.userInfo.baseInfo.levelName;
							$.isPlusVip = data.data.userInfo.isPlusVip;

						}
						if (data['retcode'] === '0' && data.data && data.data['assetInfo']) {
							if ($.beanCount == 0)
								$.beanCount = data.data && data.data['assetInfo']['beanNum'];
						} else {
							$.errorMsg = `数据异常`;
						}
					} else {
						$.log('京东服务器返回空数据,将无法获取等级及VIP信息');
					}
				}
			} catch (e) {
				$.logErr(e)
			}
			finally {
				resolve();
			}
		})
	})
} */

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0) {
                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
                            $.isPlusVip=data['isPlusVip'];
                            $.isRealNameAuth=data['isRealNameAuth'];
                            $.beanCount=(data['base'] && data['base'].jdNum) || 0 ;
                            $.JingXiang = (data['base'] && data['base'].jvalue) || 0 ;
                        } else {
                            $.nickName = $.UserName
                        }



                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function TotalBean2() {
    return new Promise(async(resolve) => {
        const options = {
            url: `https://wxapp.m.jd.com/kwxhome/myJd/home.json?&useGuideModule=0&bizId=&brandId=&fromType=wxapp&timestamp=${Date.now()}`,
            headers: {
                Cookie: cookie,
                'content-type': `application/x-www-form-urlencoded`,
                Connection: `keep-alive`,
                'Accept-Encoding': `gzip,compress,br,deflate`,
                Referer: `https://servicewechat.com/wxa5bf5ee667d91626/161/page-frame.html`,
                Host: `wxapp.m.jd.com`,
                'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.10(0x18000a2a) NetType/WIFI Language/zh_CN`,
            },
            timeout: 10000
        };
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err);
                } else {
                    if (data) {
                        data = JSON.parse(data);

                        if (!data.user) {
                            return;
                        }
                        const userInfo = data.user;
                        if (userInfo) {
                            if (!$.nickName)
                                $.nickName = userInfo.petName;
                            if ($.beanCount == 0) {
                                $.beanCount = userInfo.jingBean;
                            }
                            $.JingXiang = userInfo.uclass;
                        }
                    } else {
                        $.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function isLoginByX1a0He() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": cookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
            timeout: 10000
        }
        $.get(options, (err, resp, data) => {
            try {
                if (data) {
                    data = JSON.parse(data);
                    if (data.islogin === "1") {
                        console.log(`使用X1a0He写的接口加强检测: Cookie有效\n`)
                    } else if (data.islogin === "0") {
                        $.isLogin = false;
                        console.log(`使用X1a0He写的接口加强检测: Cookie无效\n`)
                    } else {
                        console.log(`使用X1a0He写的接口加强检测: 未知返回，不作变更...\n`)
                        $.error = `${$.nickName} :` + `使用X1a0He写的接口加强检测: 未知返回...\n`
                    }
                }
            } catch (e) {
                console.log(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function getJingBeanBalanceDetail(page) {
    return new Promise(async resolve => {
        const options = {
            "url": `https://bean.m.jd.com/beanDetail/detail.json?page=${page}`,
            "body": `body=${escape(JSON.stringify({"pageSize": "20", "page": page.toString()}))}&appid=ld`,
            "headers": {
                'User-Agent': "Mozilla/5.0 (Linux; Android 12; SM-G9880) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36 EdgA/106.0.1370.47",
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    // console.log(`${JSON.stringify(err)}`)
                    // console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        // console.log(data)
                    } else {
                        // console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function queryexpirejingdou() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/activep3/singjd/queryexpirejingdou?_=${Date.now()}&g_login_type=1&sceneval=2`,
            "headers": {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Host": "wq.jd.com",
                "Referer": "https://wqs.jd.com/promote/201801/bean/mybean.html",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1"
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`queryexpirejingdou API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        // console.log(data)
                        data = JSON.parse(data.slice(23, -13));
                        if (data.ret === 0) {
                            data['expirejingdou'].map(item => {
                                if(item['expireamount']!=0){
                                    strGuoqi+=`【${timeFormat(item['time'] * 1000)}】过期${item['expireamount']}豆\n`;
                                    if (decExBean==0)
                                        decExBean=item['expireamount'];
                                }
                            })
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}
function exchangejxbeans(o) {
    return new Promise(async resolve => {
        var UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        var JXUA = `jdpingou;iPhone;4.13.0;14.4.2;${UUID};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`;
        const options = {
            "url": `https://m.jingxi.com/deal/masset/jd2xd?use=${o}&canpintuan=&setdefcoupon=0&r=${Math.random()}&sceneval=2`,
            "headers": {
                "Host": "m.jingxi.com",
                "Accept": "*/*",
                "Cookie": cookie,
                "Connection": "keep-alive",
                "User-Agent": JXUA,
                "Accept-Language": "zh-cn",
                "Referer": "https://m.jingxi.com/deal/confirmorder/main",
                "Accept-Encoding": "gzip, deflate, br",
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(err);
                } else {
                    data = JSON.parse(data);
                    if (data && data.data && JSON.stringify(data.data) === '{}') {
                        console.log(JSON.stringify(data))
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data || {});
            }
        })
    })
}
function getUUID(x = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", t = 0) {
    return x.replace(/[xy]/g, function (x) {
        var r = 16 * Math.random() | 0,
            n = "x" == x ? r : 3 & r | 8;
        return uuid = t ? n.toString(36).toUpperCase() : n.toString(36),
            uuid
    })
}


function redPacket() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://m.jingxi.com/user/info/QueryUserRedEnvelopesV2?type=1&orgFlag=JD_PinGou_New&page=1&cashRedType=1&redBalanceFlag=1&channel=1&_=${+new Date()}&sceneval=2&g_login_type=1&g_ty=ls`,
            "headers": {
                'Host': 'm.jingxi.com',
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Accept-Language': 'zh-cn',
                'Referer': 'https://st.jingxi.com/my/redpacket.shtml?newPg=App&jxsid=16156262265849285961',
                'Accept-Encoding': 'gzip, deflate, br',
                "Cookie": cookie,
                'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`redPacket API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data).data;
                        $.jxRed = 0,
                            $.jsRed = 0,
                            $.jdRed = 0,
                            $.jdhRed = 0,
                            $.jdwxRed = 0,
                            $.jdGeneralRed = 0,
                            $.jxRedExpire = 0,
                            $.jsRedExpire = 0,
                            $.jdRedExpire = 0,
                            $.jdhRedExpire = 0;
                        $.jdwxRedExpire = 0,
                            $.jdGeneralRedExpire = 0

                        let t = new Date();
                        t.setDate(t.getDate() + 1);
                        t.setHours(0, 0, 0, 0);
                        t = parseInt((t - 1) / 1000);
                        //console.log(JSON.stringify(data.useRedInfo.redList))
                        for (let vo of data.useRedInfo.redList || []) {
                            if (vo.limitStr && vo.limitStr.includes("京喜")) {
                                $.jxRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jxRedExpire += parseFloat(vo.balance)
                                }
                            } else if (vo.limitStr.includes("购物小程序")) {
                                $.jdwxRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jdwxRedExpire += parseFloat(vo.balance)
                                }
                            } else if (vo.limitStr.includes("京东商城")) {
                                $.jdRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jdRedExpire += parseFloat(vo.balance)
                                }
                            } else if (vo.limitStr.includes("极速版") || vo.limitStr.includes("京东特价")) {
                                $.jsRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jsRedExpire += parseFloat(vo.balance)
                                }
                            } else if (vo.limitStr && vo.limitStr.includes("京东健康")) {
                                $.jdhRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jdhRedExpire += parseFloat(vo.balance)
                                }
                            } else {
                                $.jdGeneralRed += parseFloat(vo.balance)
                                if (vo['endTime'] === t) {
                                    $.jdGeneralRedExpire += parseFloat(vo.balance)
                                }
                            }
                        }

                        $.jxRed = $.jxRed.toFixed(2);
                        $.jsRed = $.jsRed.toFixed(2);
                        $.jdRed = $.jdRed.toFixed(2);
                        $.jdhRed = $.jdhRed.toFixed(2);
                        $.jdwxRed = $.jdwxRed.toFixed(2);
                        $.jdGeneralRed = $.jdGeneralRed.toFixed(2);
                        $.balance = data.balance;
                        $.expiredBalance = ($.jxRedExpire + $.jsRedExpire + $.jdRedExpire+$.jdhRedExpire+$.jdwxRedExpire+$.jdGeneralRedExpire).toFixed(2);
                        $.message += `【红包总额】${$.balance}(总过期${$.expiredBalance})元 \n`;
                        if ($.jxRed > 0)
                            $.message += `【京喜红包】${$.jxRed}(将过期${$.jxRedExpire.toFixed(2)})元 \n`;
                        if ($.jsRed > 0)
                            $.message += `【特价红包】${$.jsRed}(将过期${$.jsRedExpire.toFixed(2)})元 \n`;
                        if ($.jdRed > 0)
                            $.message += `【京东红包】${$.jdRed}(将过期${$.jdRedExpire.toFixed(2)})元 \n`;
                        if ($.jdhRed > 0)
                            $.message += `【健康红包】${$.jdhRed}(将过期${$.jdhRedExpire.toFixed(2)})元 \n`;
                        if ($.jdwxRed > 0)
                            $.message += `【微信小程序】${$.jdwxRed}(将过期${$.jdwxRedExpire.toFixed(2)})元 \n`;
                        if ($.jdGeneralRed > 0)
                            $.message += `【全平台通用】${$.jdGeneralRed}(将过期${$.jdGeneralRedExpire.toFixed(2)})元 \n`;
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data);
            }
        })
    })
}

function getCoupon() {
    return new Promise(resolve => {
        let options = {
            url: `https://wq.jd.com/activeapi/queryjdcouponlistwithfinance?state=1&wxadd=1&filterswitch=1&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
            headers: {
                'authority': 'wq.jd.com',
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                'accept': '*/*',
                'referer': 'https://wqs.jd.com/',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'cookie': cookie
            },
            timeout: 10000
        }
        $.get(options, async(err, resp, data) => {
            try {
                data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);
                let couponTitle = '';
                let couponId = '';
                // 删除可使用且非超市、生鲜、京贴;
                let useable = data.coupon.useable;
                $.todayEndTime = new Date(new Date(new Date().getTime()).setHours(23, 59, 59, 999)).getTime();
                $.tomorrowEndTime = new Date(new Date(new Date().getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999)).getTime();
                $.platFormInfo="";
                for (let i = 0; i < useable.length; i++) {
                    //console.log(useable[i]);
                    if (useable[i].limitStr.indexOf('全品类') > -1) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].quota <= 100 && useable[i].coupontype === 1) {
                            //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.couponName = useable[i].limitStr;
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;

                            var decquota=parseFloat(useable[i].quota).toFixed(2);
                            var decdisc= parseFloat(useable[i].discount).toFixed(2);

                            $.message += `【全品类券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }
                    }
                    if (useable[i].couponTitle.indexOf('运费券') > -1 && useable[i].limitStr.indexOf('自营商品运费') > -1) {
                        if (!$.YunFeiTitle) {
                            $.YunFeiTitle = useable[i].couponTitle;
                            $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.YunFeiQuan += 1;
                        } else {
                            if ($.YunFeiTitle == useable[i].couponTitle) {
                                $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                $.YunFeiQuan += 1;
                            } else {
                                if (!$.YunFeiTitle2)
                                    $.YunFeiTitle2 = useable[i].couponTitle;

                                if ($.YunFeiTitle2 == useable[i].couponTitle) {
                                    $.YunFeiQuanEndTime2 = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                    $.YunFeiQuan2 += 1;
                                }
                            }

                        }

                    }
                    if (useable[i].couponTitle.indexOf('特价版APP活动') > -1 && useable[i].limitStr=='仅可购买活动商品') {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].coupontype === 1) {
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;
                            var decquota=parseFloat(useable[i].quota).toFixed(2);
                            var decdisc= parseFloat(useable[i].discount).toFixed(2);

                            $.message += `【特价版券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }

                    }
                    //8是支付券， 7是白条券
                    if (useable[i].couponStyle == 7 || useable[i].couponStyle == 8) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime > new Date().getTime() || useable[i].quota > 50 || useable[i].coupontype != 1) {
                            continue;
                        }

                        if (useable[i].couponStyle == 8) {
                            $.couponType = "支付立减";
                        }else{
                            $.couponType = "白条优惠";
                        }
                        if(useable[i].discount<useable[i].quota)
                            $.message += `【${$.couponType}】满${useable[i].quota}减${useable[i].discount}元`;
                        else
                            $.message += `【${$.couponType}】立减${useable[i].discount}元`;
                        if (useable[i].platFormInfo)
                            $.platFormInfo = useable[i].platFormInfo;

                        //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');

                        if (useable[i].endTime < $.todayEndTime) {
                            $.message += `(今日过期,${$.platFormInfo})\n`;
                        } else if (useable[i].endTime < $.tomorrowEndTime) {
                            $.message += `(明日将过期,${$.platFormInfo})\n`;
                        } else {
                            $.message += `(${$.platFormInfo})\n`;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            }
            finally {
                resolve();
            }
        })
    })
}

function getJdZZ() {
    if (!EnableJdZZ)
        return;
    return new Promise(resolve => {
        $.get(taskJDZZUrl("interactTaskIndex"), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`京东赚赚API请求失败，请检查网路重试`);
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data);
                        $.JdzzNum = data.data.totalNum;
                    }
                }
            } catch (e) {
                //$.logErr(e, resp)
                console.log(`京东赚赚数据获取失败`);
            }
            finally {
                resolve(data);
            }
        })
    })
}

function taskJDZZUrl(functionId, body = {}) {
    return {
        url: `${JD_API_HOST}?functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=9.1.0`,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json',
            'Referer': 'http://wq.jd.com/wxapp/pages/hd-interaction/index/index',
            'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            'Accept-Language': 'zh-cn',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 10000
    }
}

function jdfruitRequest(function_id, body = {}, timeout = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            $.get(taskfruitUrl(function_id, body), (err, resp, data) => {
                try {
                    if (err) {
                        console.log('\n东东农场: API查询请求失败 ‼️‼️')
                        console.log(JSON.stringify(err));
                        console.log(`function_id:${function_id}`)
                        $.logErr(err);
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                            if (data.code=="400"){
                                console.log('东东农场: '+data.message);
                                llgeterror = true;
                            }
                            else
                                $.JDwaterEveryDayT = data.totalWaterTaskInit.totalWaterTaskTimes;
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            })
        }, timeout)
    })
}

async function getjdfruitinfo() {
    if (EnableJdFruit) {
        llgeterror = false;

        await jdfruitRequest('taskInitForFarm', {
            "version": 14,
            "channel": 1,
            "babelChannel": "120"
        });

        if (llgeterror)
            return

        await getjdfruit();
        if (llgeterror) {
            console.log(`东东农场API查询失败,等待10秒后再次尝试...`)
            await $.wait(10 * 1000);
            await getjdfruit();
        }
        if (llgeterror) {
            console.log(`东东农场API查询失败,有空重启路由器换个IP吧.`)
        }

    }
    return;
}

async function GetJxBeaninfo() {
    await GetJxBean(),
        await jxbean();
    return;
}

async function getjdfruit() {
    return new Promise(resolve => {
        const option = {
            url: `${JD_API_HOST}?functionId=initForFarm`,
            body: `body=${escape(JSON.stringify({"version":4}))}&appid=wh5&clientVersion=9.1.0`,
            headers: {
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "cookie": cookie,
                "origin": "https://home.m.jd.com",
                "pragma": "no-cache",
                "referer": "https://home.m.jd.com/myJd/newhome.action",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 10000
        };
        $.post(option, (err, resp, data) => {
            try {
                if (err) {
                    if(!llgeterror){
                        console.log('\n东东农场: API查询请求失败 ‼️‼️');
                        console.log(JSON.stringify(err));
                    }
                    llgeterror = true;
                } else {
                    llgeterror = false;
                    if (safeGet(data)) {
                        $.farmInfo = JSON.parse(data)
                        if ($.farmInfo.farmUserPro) {
                            $.JdFarmProdName = $.farmInfo.farmUserPro.name;
                            $.JdtreeEnergy = $.farmInfo.farmUserPro.treeEnergy;
                            $.JdtreeTotalEnergy = $.farmInfo.farmUserPro.treeTotalEnergy;
                            $.treeState = $.farmInfo.treeState;
                            let waterEveryDayT = $.JDwaterEveryDayT;
                            let waterTotalT = ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy - $.farmInfo.farmUserPro.totalEnergy) / 10; //一共还需浇多少次水
                            let waterD = Math.ceil(waterTotalT / waterEveryDayT);

                            $.JdwaterTotalT = waterTotalT;
                            $.JdwaterD = waterD;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

function taskfruitUrl(function_id, body = {}) {
    return {
        url: `${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`,
        headers: {
            "Host": "api.m.jd.com",
            "Accept": "*/*",
            "Origin": "https://carry.m.jd.com",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Referer": "https://carry.m.jd.com/",
            "Cookie": cookie
        },
        timeout: 10000
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function cash() {
    if (!EnableJdSpeed)
        return;
    return new Promise(resolve => {
        $.get(taskcashUrl('MyAssetsService.execute', {
                "method": "userCashRecord",
                "data": {
                    "channel": 1,
                    "pageNum": 1,
                    "pageSize": 20
                }
            }),
            async(err, resp, data) => {
                try {
                    if (err) {
                        console.log(`${JSON.stringify(err)}`)
                        console.log(`cash API请求失败，请检查网路重试`)
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                            if (data.data.goldBalance)
                                $.JDtotalcash = data.data.goldBalance;
                            else
                                console.log(`领现金查询失败，服务器没有返回具体值.`)
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp)
                }
                finally {
                    resolve(data);
                }
            })
    })
}

var __Oxb24bc = ["lite-android&", "stringify", "&android&3.1.0&", "&", "&846c4c32dae910ef", "12aea658f76e453faf803d15c40a72e0", "isNode", "crypto-js", "", "api?functionId=", "&body=", "&appid=lite-android&client=android&uuid=846c4c32dae910ef&clientVersion=3.1.0&t=", "&sign=", "api.m.jd.com", "*/*", "RN", "JDMobileLite/3.1.0 (iPad; iOS 14.4; Scale/2.00)", "zh-Hans-CN;q=1, ja-CN;q=0.9", "undefined", "log", "", "", "", "", "jsjia", "mi.com"];

function taskcashUrl(_0x7683x2, _0x7683x3 = {}) {
    let _0x7683x4 = +new Date();
    let _0x7683x5 = `${__Oxb24bc[0x0]}${JSON[__Oxb24bc[0x1]](_0x7683x3)}${__Oxb24bc[0x2]}${_0x7683x2}${__Oxb24bc[0x3]}${_0x7683x4}${__Oxb24bc[0x4]}`;
    let _0x7683x6 = __Oxb24bc[0x5];
    const _0x7683x7 = $[__Oxb24bc[0x6]]() ? require(__Oxb24bc[0x7]) : CryptoJS;
    let _0x7683x8 = _0x7683x7.HmacSHA256(_0x7683x5, _0x7683x6).toString();
    return {
        url: `${__Oxb24bc[0x8]}${JD_API_HOST}${__Oxb24bc[0x9]}${_0x7683x2}${__Oxb24bc[0xa]}${escape(JSON[__Oxb24bc[0x1]](_0x7683x3))}${__Oxb24bc[0xb]}${_0x7683x4}${__Oxb24bc[0xc]}${_0x7683x8}${__Oxb24bc[0x8]}`,
        headers: {
            'Host': __Oxb24bc[0xd],
            'accept': __Oxb24bc[0xe],
            'kernelplatform': __Oxb24bc[0xf],
            'user-agent': __Oxb24bc[0x10],
            'accept-language': __Oxb24bc[0x11],
            'Cookie': cookie
        },
        timeout: 10000
    }
}
(function (_0x7683x9, _0x7683xa, _0x7683xb, _0x7683xc, _0x7683xd, _0x7683xe) {
    _0x7683xe = __Oxb24bc[0x12];
    _0x7683xc = function (_0x7683xf) {
        if (typeof alert !== _0x7683xe) {
            alert(_0x7683xf)
        };
        if (typeof console !== _0x7683xe) {
            console[__Oxb24bc[0x13]](_0x7683xf)
        }
    };
    _0x7683xb = function (_0x7683x7, _0x7683x9) {
        return _0x7683x7 + _0x7683x9
    };
    _0x7683xd = _0x7683xb(__Oxb24bc[0x14], _0x7683xb(_0x7683xb(__Oxb24bc[0x15], __Oxb24bc[0x16]), __Oxb24bc[0x17]));
    try {
        _0x7683x9 = __encode;
        if (!(typeof _0x7683x9 !== _0x7683xe && _0x7683x9 === _0x7683xb(__Oxb24bc[0x18], __Oxb24bc[0x19]))) {
            _0x7683xc(_0x7683xd)
        }
    } catch (e) {
        _0x7683xc(_0x7683xd)
    }
})({})

async function JxmcGetRequest() {
    let url = ``;
    let myRequest = ``;
    url = `https://m.jingxi.com/jxmc/queryservice/GetHomePageInfo?channel=7&sceneid=1001&activeid=null&activekey=null&isgift=1&isquerypicksite=1&_stk=channel%2Csceneid&_ste=1`;
    url += `&h5st=${decrypt(Date.now(), '', '', url)}&_=${Date.now() + 2}&sceneval=2&g_login_type=1&callback=jsonpCBK${String.fromCharCode(Math.floor(Math.random() * 26) + "A".charCodeAt(0))}&g_ty=ls`;
    myRequest = getGetRequest(`GetHomePageInfo`, url);

    return new Promise(async resolve => {
        $.get(myRequest, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`JxmcGetRequest API请求失败，请检查网路重试`)
                    $.runFlag = false;
                    console.log(`请求失败`)
                } else {
                    data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);
                    if (data.ret === 0) {
                        $.JDEggcnt = data.data.eggcnt;
                    }
                }
            } catch (e) {
                console.log(data);
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

// 东东工厂信息查询
async function getDdFactoryInfo() {
    if (!EnableJDGC)
        return;
    // 当心仪的商品存在，并且收集起来的电量满足当前商品所需，就投入
    let infoMsg = "";
    return new Promise(resolve => {
        $.post(ddFactoryTaskUrl('jdfactory_getHomeData'), async(err, resp, data) => {
            try {
                if (err) {
                    $.ddFactoryInfo = "获取失败!"
                    /*console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)*/
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data);
                        if (data.data.bizCode === 0) {
                            // $.newUser = data.data.result.newUser;
                            //let wantProduct = $.isNode() ? (process.env.FACTORAY_WANTPRODUCT_NAME ? process.env.FACTORAY_WANTPRODUCT_NAME : wantProduct) : ($.getdata('FACTORAY_WANTPRODUCT_NAME') ? $.getdata('FACTORAY_WANTPRODUCT_NAME') : wantProduct);
                            if (data.data.result.factoryInfo) {
                                let {
                                    totalScore,
                                    useScore,
                                    produceScore,
                                    remainScore,
                                    couponCount,
                                    name
                                } = data.data.result.factoryInfo;
                                if (couponCount == 0) {
                                    infoMsg = `${name} 没货了,死了这条心吧!`
                                } else {
                                    infoMsg = `${name}(${((remainScore * 1 + useScore * 1) / (totalScore * 1)* 100).toFixed(0)}%,剩${couponCount})`
                                }
                                if (((remainScore * 1 + useScore * 1) >= totalScore * 1 + 100000) && (couponCount * 1 > 0)) {
                                    // await jdfactory_addEnergy();
                                    infoMsg = `${name} 可以兑换了!`
                                    $.DdFactoryReceive = `${name}`;

                                }

                            } else {
                                infoMsg = ``
                            }
                        } else {
                            $.ddFactoryInfo = ""
                        }
                    }
                }
                $.ddFactoryInfo = infoMsg;
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

function ddFactoryTaskUrl(function_id, body = {}, function_id2) {
    let url = `${JD_API_HOST}`;
    if (function_id2) {
        url += `?functionId=${function_id2}`;
    }
    return {
        url,
        body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.1.0`,
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie,
            "Host": "api.m.jd.com",
            "Origin": "https://h5.m.jd.com",
            "Referer": "https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html",
            "User-Agent": "jdapp;iPhone;9.3.4;14.3;88732f840b77821b345bf07fd71f609e6ff12f43;network/4g;ADID/1C141FDD-C62F-425B-8033-9AAB7E4AE6A3;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,8;addressid/2005183373;supportBestPay/0;appBuild/167502;jdSupportDarkMode/0;pv/414.19;apprpd/Babel_Native;ref/TTTChannelViewContoller;psq/5;ads/;psn/88732f840b77821b345bf07fd71f609e6ff12f43|1701;jdv/0|iosapp|t_335139774|appshare|CopyURL|1610885480412|1610885486;adk/;app_device/IOS;pap/JA2015_311210|9.3.4|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        },
        timeout: 10000
    }
}

async function getJoyBaseInfo(taskId = '', inviteType = '', inviterPin = '') {
    if (!EnableJoyPark)
        return;
    return new Promise(resolve => {
        $.post(taskPostClientActionUrl(`body={"taskId":"${taskId}","inviteType":"${inviteType}","inviterPin":"${inviterPin}","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&appid=activities_platform`), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`汪汪乐园 API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if (data.success) {
                        $.joylevel = data.data.level;
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}
function taskPostClientActionUrl(body) {
    return {
        url: `https://api.m.jd.com/client.action?functionId=joyBaseInfo`,
        body: body,
        headers: {
            'User-Agent': $.user_agent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'api.m.jd.com',
            'Origin': 'https://joypark.jd.com',
            'Referer': 'https://joypark.jd.com/?activityId=LsQNxL7iWDlXUs6cFl-AAg&lng=113.387899&lat=22.512678&sid=4d76080a9da10fbb31f5cd43396ed6cw&un_area=19_1657_52093_0',
            'Cookie': cookie,
        },
        timeout: 10000
    }
}

function taskJxUrl(functionId, body = '') {
    let url = ``;
    var UA = `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`;

    if (body) {
        url = `https://m.jingxi.com/activeapi/${functionId}?${body}`;
        url += `&_=${Date.now() + 2}&sceneval=2&g_login_type=1&callback=jsonpCBK${String.fromCharCode(Math.floor(Math.random() * 26) + "A".charCodeAt(0))}&g_ty=ls`;
    } else {
        url = `https://m.jingxi.com/activeapi/${functionId}?_=${Date.now() + 2}&sceneval=2&g_login_type=1&callback=jsonpCBK${String.fromCharCode(Math.floor(Math.random() * 26) + "A".charCodeAt(0))}&g_ty=ls`;
    }
    return {
        url,
        headers: {
            "Host": "m.jingxi.com",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": UA,
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Referer": "https://st.jingxi.com/",
            "Cookie": cookie
        },
        timeout: 10000
    }
}


function GetJxBeanDetailData() {
    return new Promise((resolve) => {
        $.get(taskJxUrl("queryuserjingdoudetail","pagesize=10&type=16"), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(JSON.stringify(err));
                    console.log(`GetJxBeanDetailData请求失败，请检查网路重试`);
                } else {
                    data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);

                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}
function GetJxBean() {
    if (!EnableJxBeans)
        return;
    return new Promise((resolve) => {
        $.get(taskJxUrl("querybeanamount"), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(JSON.stringify(err));
                    console.log(`GetJxBean请求失败，请检查网路重试`);
                } else {
                    data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);
                    if (data) {
                        if (data.errcode == 0) {
                            $.xibeanCount = data.data.xibean;
                            if (!$.beanCount) {
                                $.beanCount = data.data.jingbean;
                            }
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            }
            finally {
                resolve(data);
            }
        });
    });
}
async function jxbean() {
    if (!EnableJxBeans)
        return;
    //前一天的0:0:0时间戳
    const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000);
    // 今天0:0:0时间戳
    const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
    var JxYesterdayArr = [],
        JxTodayArr = [];
    var JxResponse = await GetJxBeanDetailData();
    if (JxResponse && JxResponse.ret == "0") {
        var Jxdetail = JxResponse.detail;
        if (Jxdetail && Jxdetail.length > 0) {
            for (let item of Jxdetail) {
                const date = item.createdate.replace(/-/g, '/') + "+08:00";
                if (new Date(date).getTime() >= tm1 && (!item['visibleinfo'].includes("退还") && !item['visibleinfo'].includes('扣赠'))) {
                    JxTodayArr.push(item);
                } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && (!item['visibleinfo'].includes("退还") && !item['visibleinfo'].includes('扣赠'))) {
                    //昨日的
                    JxYesterdayArr.push(item);
                } else if (tm > new Date(date).getTime()) {
                    break;
                }
            }
        } else {
            $.errorMsg = `数据异常`;
            $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
        }

        for (let item of JxYesterdayArr) {
            if (Number(item.amount) > 0) {
                $.inJxBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.OutJxBean += Number(item.amount);
            }
        }
        for (let item of JxTodayArr) {
            if (Number(item.amount) > 0) {
                $.todayinJxBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.todayOutJxBean += Number(item.amount);
            }
        }
        $.todayOutJxBean = -$.todayOutJxBean;
        $.OutJxBean = -$.OutJxBean;
    }

}

function GetJoyRuninginfo() {
    if (!EnableJoyRun)
        return;

    const headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Connection": "keep-alive",
        "Content-Length": "376",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookie,
        "Host": "api.m.jd.com",
        "Origin": "https://h5platform.jd.com",
        "Referer": "https://h5platform.jd.com/",
        "User-Agent": `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`
    }
    var DateToday = new Date();
    const body = {
        'linkId': 'L-sOanK_5RJCz7I314FpnQ',
        'isFromJoyPark':true,
        'joyLinkId':'LsQNxL7iWDlXUs6cFl-AAg'
    };
    const options = {
        url: `https://api.m.jd.com/?functionId=runningPageHome&body=${encodeURIComponent(JSON.stringify(body))}&t=${DateToday.getTime()}&appid=activities_platform&client=ios&clientVersion=3.9.2`,
        headers,
    }
    return new Promise(resolve => {
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`GetJoyRuninginfo API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        //console.log(data);
                        data = JSON.parse(data);
                        if (data.data.runningHomeInfo.prizeValue) {
                            $.JoyRunningAmount=data.data.runningHomeInfo.prizeValue * 1;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data)
            }
        })
    })
}

function randomString(e) {
    e = e || 32;
    let t = "0123456789abcdef",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function getGetRequest(type, url) {
    UA = `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`

    const method = `GET`;
    let headers = {
        'Origin': `https://st.jingxi.com`,
        'Cookie': cookie,
        'Connection': `keep-alive`,
        'Accept': `application/json`,
        'Referer': `https://st.jingxi.com/pingou/jxmc/index.html`,
        'Host': `m.jingxi.com`,
        'User-Agent': UA,
        'Accept-Encoding': `gzip, deflate, br`,
        'Accept-Language': `zh-cn`
    };
    return {
        url: url,
        method: method,
        headers: headers,
        timeout: 10000
    };
}

Date.prototype.Format = function (fmt) {
    var e,
        n = this,
        d = fmt,
        l = {
            "M+": n.getMonth() + 1,
            "d+": n.getDate(),
            "D+": n.getDate(),
            "h+": n.getHours(),
            "H+": n.getHours(),
            "m+": n.getMinutes(),
            "s+": n.getSeconds(),
            "w+": n.getDay(),
            "q+": Math.floor((n.getMonth() + 3) / 3),
            "S+": n.getMilliseconds()
        };
    /(y+)/i.test(d) && (d = d.replace(RegExp.$1, "".concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
    for (var k in l) {
        if (new RegExp("(".concat(k, ")")).test(d)) {
            var t,
                a = "S+" === k ? "000" : "00";
            d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : ("".concat(a) + l[k]).substr("".concat(l[k]).length))
        }
    }
    return d;
}

function decrypt(time, stk, type, url) {
    $.appId = 10028;
    stk = stk || (url ? getJxmcUrlData(url, '_stk') : '')
    if (stk) {
        const timestamp = new Date(time).Format("yyyyMMddhhmmssSSS");
        let hash1 = '';
        if ($.fingerprint && $.Jxmctoken && $.enCryptMethodJD) {
            hash1 = $.enCryptMethodJD($.Jxmctoken, $.fingerprint.toString(), timestamp.toString(), $.appId.toString(), $.CryptoJS).toString($.CryptoJS.enc.Hex);
        } else {
            const random = '5gkjB6SpmC9s';
            $.Jxmctoken = `tk01wcdf61cb3a8nYUtHcmhSUFFCfddDPRvKvYaMjHkxo6Aj7dhzO+GXGFa9nPXfcgT+mULoF1b1YIS1ghvSlbwhE0Xc`;
            $.fingerprint = 5287160221454703;
            const str = `${$.Jxmctoken}${$.fingerprint}${timestamp}${$.appId}${random}`;
            hash1 = $.CryptoJS.SHA512(str, $.Jxmctoken).toString($.CryptoJS.enc.Hex);
        }
        let st = '';
        stk.split(',').map((item, index) => {
            st += `${item}:${getJxmcUrlData(url, item)}${index === stk.split(',').length - 1 ? '' : '&'}`;
        })
        const hash2 = $.CryptoJS.HmacSHA256(st, hash1.toString()).toString($.CryptoJS.enc.Hex);
        return encodeURIComponent(["".concat(timestamp.toString()), "".concat($.fingerprint.toString()), "".concat($.appId.toString()), "".concat($.Jxmctoken), "".concat(hash2)].join(";"))
    } else {
        return '20210318144213808;8277529360925161;10001;tk01w952a1b73a8nU0luMGtBanZTHCgj0KFVwDa4n5pJ95T/5bxO/m54p4MtgVEwKNev1u/BUjrpWAUMZPW0Kz2RWP8v;86054c036fe3bf0991bd9a9da1a8d44dd130c6508602215e50bb1e385326779d'
    }
}

async function requestAlgo() {
    $.fingerprint = await generateFp();
    $.appId = 10028;
    const options = {
        "url": `https://cactus.jd.com/request_algo?g_ty=ajax`,
        "headers": {
            'Authority': 'cactus.jd.com',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
            'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            //'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            'Content-Type': 'application/json',
            'Origin': 'https://st.jingxi.com',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://st.jingxi.com/',
            'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7'
        },
        'body': JSON.stringify({
            "version": "1.0",
            "fp": $.fingerprint,
            "appId": $.appId.toString(),
            "timestamp": Date.now(),
            "platform": "web",
            "expandParams": ""
        })
    }
    new Promise(async resolve => {
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`request_algo 签名参数API请求失败，请检查网路重试`)
                    llgeterror = true;
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['status'] === 200) {
                            $.Jxmctoken = data.data.result.tk;
                            let enCryptMethodJDString = data.data.result.algo;
                            if (enCryptMethodJDString)
                                $.enCryptMethodJD = new Function(`return ${enCryptMethodJDString}`)();
                        } else {
                            console.log('request_algo 签名参数API请求失败:')
                        }
                    } else {
                        llgeterror = true;
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                llgeterror = true;
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

function generateFp() {
    let e = "0123456789";
    let a = 13;
    let i = '';
    for (; a--; )
        i += e[Math.random() * e.length | 0];
    return (i + Date.now()).slice(0, 16)
}

function getJxmcUrlData(url, name) {
    if (typeof URL !== "undefined") {
        let urls = new URL(url);
        let data = urls.searchParams.get(name);
        return data ? data : '';
    } else {
        const query = url.match(/\?.*/)[0].substring(1)
        const vars = query.split('&')
        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split('=')
            if (pair[0] === name) {
                return vars[i].substr(vars[i].indexOf('=') + 1);
            }
        }
        return ''
    }
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
function timeFormat(time) {
    let date;
    if (time) {
        date = new Date(time)
    } else {
        date = new Date();
    }
    return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}


function GetPigPetInfo() {
    if (!EnablePigPet)
        return;
    return new Promise(async resolve => {
        const body = {
            "shareId": "",
            "source": 2,
            "channelLV": "juheye",
            "riskDeviceParam": "{}",
        }
        $.post(taskPetPigUrl('pigPetLogin', body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`GetPigPetInfo API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data.resultData.resultData.wished && data.resultData.resultData.wishAward) {
                            $.PigPet=`${data.resultData.resultData.wishAward.name}`
                        }
                    } else {
                        console.log(`GetPigPetInfo: 京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}


function taskPetPigUrl(function_id, body) {
    var UA = `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`;
    return {
        url: `https://ms.jr.jd.com/gw/generic/uc/h5/m/${function_id}?_=${Date.now()}`,
        body: `reqData=${encodeURIComponent(JSON.stringify(body))}`,
        headers: {
            'Accept': `*/*`,
            'Origin': `https://u.jr.jd.com`,
            'Accept-Encoding': `gzip, deflate, br`,
            'Cookie': cookie,
            'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
            'Host': `ms.jr.jd.com`,
            'Connection': `keep-alive`,
            'User-Agent': UA,
            'Referer': `https://u.jr.jd.com/`,
            'Accept-Language': `zh-cn`
        },
        timeout: 10000
    }
}

function GetDateTime(date) {

    var timeString = "";

    var timeString = date.getFullYear() + "-";
    if ((date.getMonth() + 1) < 10)
        timeString += "0" + (date.getMonth() + 1) + "-";
    else
        timeString += (date.getMonth() + 1) + "-";

    if ((date.getDate()) < 10)
        timeString += "0" + date.getDate() + " ";
    else
        timeString += date.getDate() + " ";

    if ((date.getHours()) < 10)
        timeString += "0" + date.getHours() + ":";
    else
        timeString += date.getHours() + ":";

    if ((date.getMinutes()) < 10)
        timeString += "0" + date.getMinutes() + ":";
    else
        timeString += date.getMinutes() + ":";

    if ((date.getSeconds()) < 10)
        timeString += "0" + date.getSeconds();
    else
        timeString += date.getSeconds();

    return timeString;
}

async function queryScores() {
    if (!$.isPlusVip)
        return
    let res = ''
    let url = {
        url: `https://rsp.jd.com/windControl/queryScore/v1?lt=m&an=plus.mobile&stamp=${Date.now()}`,
        headers: {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Redmi Note 8 Pro Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045715 Mobile Safari/537.36',
            'Referer': 'https://plus.m.jd.com/rights/windControl'
        }
    };

    $.get(url, async (err, resp, data) => {
        try {
            const result = JSON.parse(data)
            if (result.code == 1000) {
                $.PlustotalScore=result.rs.userSynthesizeScore.totalScore;
            }
        } catch (e) {
            $.logErr(e, resp);
        }
    })

}

async function getuserinfo() {
    var body=[{"pin": "$cooMrdGatewayUid$"}];
    var ua = `jdapp;iPhone;${random(["11.1.0", "10.5.0", "10.3.6"])};${random(["13.5", "14.0", "15.0"])};${uuidRandom()};network/wifi;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,6;addressid/7565095847;supportBestPay/0;appBuild/167541;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;

    let config = {
        url: 'https://lop-proxy.jd.com/JingIntegralApi/userAccount',
        body: JSON.stringify(body),
        headers: {
            "host": "lop-proxy.jd.com",
            "jexpress-report-time": Date.now().toString(),
            "access": "H5",
            "source-client": "2",
            "accept": "application/json, text/plain, */*",
            "d_model": "iPhone11,6",
            "accept-encoding": "gzip",
            "lop-dn": "jingcai.jd.com",
            "user-agent": ua,
            "partner": "",
            "screen": "375*812",
            "cookie": cookie,
            "x-requested-with": "XMLHttpRequest",
            "version": "1.0.0",
            "uuid": randomNumber(10),
            "clientinfo": "{\"appName\":\"jingcai\",\"client\":\"m\"}",
            "d_brand": "iPhone",
            "appparams": "{\"appid\":158,\"ticket_type\":\"m\"}",
            "sdkversion": "1.0.7",
            "area": area(),
            "client": "iOS",
            "referer": "https://jingcai-h5.jd.com/",
            "eid": "",
            "osversion": random(["13.5", "14.0", "15.0"]),
            "networktype": "wifi",
            "jexpress-trace-id": uuid(),
            "origin": "https://jingcai-h5.jd.com",
            "app-key": "jexpress",
            "event-id": uuid(),
            "clientversion": random(["11.1.0", "10.5.0", "10.3.6"]),
            "content-type": "application/json;charset=utf-8",
            "build": "167541",
            "biz-type": "service-monitor",
            "forcebot": "0"
        }
    }
    return new Promise(resolve => {
        $.post(config, async(err, resp, data) => {
            try {
                //console.log(data)
                if (err) {
                    console.log(err)
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data || '');
            }
        })
    })
}
function area() {
    let i = getRand(1, 30)
    let o = getRand(70, 3000)
    let x = getRand(900, 60000)
    let g = getRand(600, 30000)
    let a = i + '_' + o + '_' + x + '_' + g;
    return a
};
function getRand(min, max) {
    return parseInt(Math.random() * (max - min)) + min;
};
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
};
function uuidRandom() {
    return Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10);
}
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumber(len) {
    let chars = '0123456789';
    let maxPos = chars.length;
    let str = '';
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return Date.now() + str;
}
