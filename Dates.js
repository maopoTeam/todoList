
/**
*	数据层
*	主要以localStorage存储
*	Create by MoNorth 2016.4.20
**/



var Dates = new function(){
	if(!window.localStorage || !localStorage.getItem || !localStorage.setItem)
	{
		console.error("不支持本地存储功能");
		return;
	}
	/**
		私有变量区
	**/
	var todoList = "todoList";
	var dates = {};

	/**
		私有函数区
	**/

	//获取数据
	var getDates = function(){
		dates = JSON.parse(localStorage.getItem(todoList)) || {};
	};

	//存储数据
	var save = function(){
		localStorage.setItem(todoList,JSON.stringify(dates));
	};
	var clone = function(obj){
		var obj2 = {};
		for(var i in obj)
			obj2[i] = obj[i];
		return obj2;
	};
	var hasProName = function(proName)
	{
		if(!proName)
			return "参数不完整";
		if(!dates[proName])
			return "没有此仓库";
		return false;
	};
	var hasItemName = function(proName,itemName)
	{
		var pro = hasProName(proName);
		if(pro)
			return pro;
		else
		{
			if(!itemName)
				return "参数不完整";
			if(!dates[proName].item[itemName])
				return "没有此项目";
			return false;
		}
	}


	//初始化区
	getDates();


	/**
		共有函数区
	**/

	//添加仓库
	this.postPro = function(date){
		var result = {error:"",proInfo:{}};
		if(!date.proName || !date.proDesc)
		{
			result.error = "参数不完整";
			return result;
		}
		if(dates[date.proName])
		{
			result.error = "仓库已存在";
			return result;
		}
		date.proSetTime = (new Date()).getTime() + "";
		var addResult = clone(date);
		addResult.item = {};
		dates[date.proName] = addResult;
		save();
		return date;
	};

	//获取所有仓库名称
	this.getProName = function(){
		var result = {count:0,result:[]};
		for(var i in dates)
			result.result.push(i);
		result.count = result.result.length;
		return result;
	};



	//获取仓库详情
	this.getProInfo = function(proName){
		var result = {error:"",info:{}};
		var error = hasProName(proName);
		if(error)
		{
			result.error = error;
			return result;
		}
		result.info = clone(dates[proName]);
		result.info.item = [];
		for(var i in dates[proName].item)
			result.info.item.push(i);
		return result;
	};

	//删除仓库
	this.deletePro = function(proName){
		var result = this.getProInfo(proName);
		if(result.error)
			return result;
		delete dates[proName];
		save();
		return result;
	};

	//修改仓库
	this.putPro = function(proName,pro)
	{
		var error = hasProName(proName);
		if(error)
		{
			return {error:error,result:{}};
		}
		pro.proDesc ? dates[proName].proDesc = pro.proDesc : "";
		if(pro.proName && pro.proName !== proName)
		{
			for(var item in dates[proName].item)
				dates[proName].item[item].proName = proName;
			dates[proName].proName = pro.proName;
			dates[pro.proName] = dates[proName];
			delete dates[proName];
		}
		save();
		return this.getProInfo(pro.proName || proName);
	}

	//清空仓库
	this.clearPro = function(proName)
	{
		var error = hasProName(proName);
		if(error)
		{
			return {error:error,result:{}};
		}
		var item = [];
		for(var i in dates[proName].item)
			item.push(i);
		dates[proName].item = {};
		save();
		return {error:"",item : item};
	}

	//添加项目
	this.postItem = function(proName,item){
		var result = {error:"",itemInfo:{}};
		if(!proName || !item.itemName || !item.itemEndTime || !item.itemDesc)
		{
			result.error = "参数不完整";
			return result;
		}
		if(!dates[proName])
		{
			result.error = "没有此仓库";
			return result;
		}
		if(dates[proName].item[item.itemName])
		{
			result.error = "项目已存在";
			return result;
		}
		item.proName = proName;
		item.itemSetTime = (new Date()).getTime() + "";
		if(!item.itemBeginTime)
			item.itemBeginTime = item.itemSetTime;
		if(item.itemBeginTime - item.itemEndTime > 0)
		{
			result.error = "时间设置错误";
			return result;
		}
		item.itemFinish = false;
		var addResult = clone(item);
		dates[proName].item[item.itemName] = addResult;
		save();
		result.itemInfo = item;
		return result;
	};

	//获取项目详情
	this.getItemInfo = function(proName,itemName){
		var result = {error:"",info:{}}
		var error = hasItemName(proName,itemName);
		if(error)
		{
			result.error = error;
			return result;
		}
		result.info = clone(dates[proName].item[itemName]);
		return result;
	};

	//获取所有待完成项目
	this.getWaitItem = function(time){
		var result = {count : 0, result : []};
		var timeNow = new Date().getTime();
		var sw = 0;
		if(Object.prototype.toString.call(time) === '[object String]')
			sw = 1;
		if(Object.prototype.toString.call(time) === '[object Number]')
			sw = 2;
		for(var pro in dates)
			for(var item in dates[pro].item)
			{
				if(!dates[pro].item[item].itemFinish && dates[pro].item[item].itemEndTime - timeNow > 0)
					switch(sw)
					{
						case 0 :
							result.result.push({proName:pro,itemName:item});
							break;
						case 1 : 
							if(dates[pro].item[item].itemEndTime - time > 0)
								result.result.push({proName:pro,itemName:item});
							break;
						case 2 :
							if(dates[pro].item[item].itemEndTime - (timeNow + time * 24 * 60 * 60 * 1000) > 0)
								result.result.push({proName:pro,itemName:item});
							break;
					}
			}
		result.count = result.result.length;
		return result;
	};

	//获取已完成项目
	this.getFinishItem = function(proName)
	{
		var result = {count : 0, result : []};
		if(proName && dates[proName])
		{
			for(var item in dates[proName].item)
				if(dates[proName].item[item].itemFinish)
					result.result.push({proName:proName,itemName:item});
		}else
		{
			for(var pro in dates)
				for(var item in dates[pro].item)
					if(dates[pro].item[item].itemFinish)
						result.result.push({proName:pro,itemName:item});
		}
		result.count = result.result.length;
		return result;
	};

	//获取所有未完成项目
	this.getFailItem = function(proName)
	{
		var result = {count : 0, result : []};
		var timeNow = new Date().getTime();
		if(proName && dates[proName])
		{
			for(var item in dates[proName].item)
				if(!dates[proName].item[item].itemFinish && dates[proName].item[item].itemEndTime - timeNow < 0)
					result.result.push({proName:proName,itemName:item});
		}else
		{
			for(var pro in dates)
				for(var item in dates[pro].item)
					if(!dates[pro].item[item].itemFinish && dates[pro].item[item].itemEndTime - timeNow < 0)
						result.result.push({proName:pro,itemName:item});
		}
		result.count = result.result.length;
		return result;
	};

	//修改项目
	this.putItem = function(proName,itemName,item){
		var result = {error:"",itemInfo:{}}
		var error = hasItemName(proName,itemName);
		if(error)
		{
			result.error = error;
			return result;
		}	
		item.itemBeginTime ? dates[proName].item[itemName].itemBeginTime = item.itemBeginTime : "";
		item.itemEndTime ? dates[proName].item[itemName].itemEndTime = item.itemEndTime : "";
		item.itemDesc ? dates[proName].item[itemName].itemDesc = item.itemDesc : "";
		if(item.itemName && item.itemName !== itemName)
		{
			dates[proName].item[itemName].itemName = item.itemName;
			dates[item.itemName] = dates[proName].item[itemName];
			delete dates[proName].item[itemName];
		}
		if(item.proName && item.proName !== proName)
		{
			var old = this.deleteItem(proName,item.itemName || itemName);
			if(old.error)
				return old;
			var news = this.postItem(item.proName,{
				itemName : old.itemInfo.itemName,
				itemBeginTime : old.itemInfo.itemBeginTime,
				itemEndTime : old.itemInfo.itemEndTime,
				itemDesc : old.itemInfo.itemDesc
			});
			if(news.error)
				return news;
		}
		save();
		return this.getItemInfo(item.proName || proName, item.itemName || itemName); 

	};

	//删除项目
	this.deleteItem = function(proName,itemName)
	{
		var result = {error:"",itemInfo:{}}
		var error = hasItemName(proName,itemName);
		if(error)
		{
			result.error = error;
			return result;
		}
		result.itemInfo = dates[proName].item[itemName];
		delete dates[proName].item[itemName];
		save();
		return result;
	};

	//更改项目完成状态
	this.putItemStatus = function(proName,itemName,itemFinish){
		var result = {error:"",itemInfo:{}}
		var error = hasItemName(proName,itemName);
		if(error)
		{
			result.error = error;
			return result;
		}
		dates[proName].item[itemName].itemFinish = itemFinish;
		save();
		return this.getItemInfo(proName,itemName);
	};

	//获取所有数据
	this.getAll = function(){
		var result = {count : 0, result : []};
		for(var pro in dates)
		{
			var length = result.result.push({
				proName : pro,
				proSetTime : dates[pro].proSetTime, //时间毫秒数
				proDesc :dates[pro].proDesc, 
				item : []
			});
			for(var item in dates[pro].item)
			{
				result.result[length - 1].item.push(clone(dates[pro].item[item]));
			}
		}
		result.count = result.result.length;
		return result;
	};
}