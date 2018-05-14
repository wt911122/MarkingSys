db.tags.insertMany([
   { tag: "车牌颜色", width: "100", height: "40" },
   { tag: "车型", width: "128", height: "128" },
]);

db.tags.insert({ tag: "行人", width: "100", height: "40" });



db.objects.insertMany([
   { object: "黄", tag: "车牌颜色", color: "#FFFF00", },
   { object: "蓝", tag: "车牌颜色", color: "#0000FF", },
   { object: "白", tag: "车牌颜色", color: "#FFFFFF", },
   { object: "黑", tag: "车牌颜色", color: "#000000", },
   { object: "轿车", tag: "车型", color: "#ffff00", },
   { object: "面包车", tag: "车型", color: "#f608df", },
   { object: "重中型货车", tag: "车型", color: "#ff0000", },
   { object: "普通轻微型货车", tag: "车型", color: "#f79c8d", },
   { object: "厢式普通轻微型货车", tag: "车型", color: "#e96e00", },
   { object: "客车", tag: "车型", color: "#00ff00", },
   { object: "挂车", tag: "车型", color: "#0000ff", },
   { object: "摩托车", tag: "车型", color: "#25cff7", },
   { object: "三轮车", tag: "车型", color: "#6a1bb1", },
]);

db.objects.insertMany([
   { object: "人", tag: "行人", color: "#FFFF00" }
]);

db.schemas.insertMany([
   { schema: "default", tag: "车牌颜色", brief: "默认方案", time: new Date(), base: null},
   { schema: "default", tag: "车型", brief: "默认方案", time: new Date(), base: null},
]);
db.schemas.insertMany([
   { schema: "default", tag: "行人", brief: "默认方案", time: new Date(), base: null},
]);