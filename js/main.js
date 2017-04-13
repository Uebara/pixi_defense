//Aliases
var Container = PIXI.Container,
Application = PIXI.Application,
autoDetectRenderer = PIXI.autoDetectRenderer,
loader = PIXI.loader,
resources = PIXI.loader.resources,
TextureCache = PIXI.utils.TextureCache,
Texture = PIXI.Texture,
Sprite = PIXI.Sprite,
Text = PIXI.Text,
Graphics = PIXI.Graphics;

//初始化stage，如果要使用层级，则不能使用new Container()初始化
var stage = new PIXI.display.Stage(),
renderer = autoDetectRenderer(900, 560);
renderer.backgroundColor = 0xaaaaaa;
document.body.appendChild(renderer.view);

loader.add("imgs/background_new.png")
.add('imgs/enemy_slm.json')
.add('imgs/green_slm.json')
.add('imgs/deft_sp.json')
.add('imgs/meiko_sp.json')
.add('imgs/bullet_heart.json')
.load(setup);

//地图格子左上角x,y坐标
var places_x = [0,120,240,360,480], places_y = [240,320,400,480];

//state游戏状态,分为play和end;hero静态角色;heros放置到画布上的的角色;bullets画布上的子弹;
//enemies画布上的敌人;message显示静态角色的冷却时间;endmsg结束显示内容;gameScene游戏界面;
//gameOverScene游戏结束界面;enemy_imgs/deft_sp/meiko_sp角色动画frame数组;hero_frames存放frame
var state, hero=[], heros, bullets, enemies, message=[], endmsg, gameScene, gameOverScene,
	firGroup, secGroup, thiGroup, fouGroup, bullteGroup, hero_frames, next, e_life_hint, h_life_hint,
	enemy_imgs=[],deft_sp=[],meiko_sp=[],b_heart_sp=[],green_slm_sp=[];
var gameHintScene;
function setup(){
	//初始化子弹的动画
 	for(var i = 0;i<2;i++){
 		b_heart_sp.push("bullet_heart "+i+".ase");
 	}
	//初始化史莱姆的动画
 	for(var i = 0;i<7;i++){
 		enemy_imgs.push("enemy_slm "+i+".ase");
 		green_slm_sp.push("green_slm "+i+".ase");
 	}
 	//初始化meiko和deft的动画
 	for(var i = 0;i<6;i++){
 		var texture = PIXI.Texture.fromFrame('meiko_sp ' + i + '.ase');
 		var texture2 = PIXI.Texture.fromFrame('deft_sp ' + i + '.ase');
 		// deft_sp.push("deft_sp "+i+".ase");
 		// meiko_sp.push("meiko_sp "+i+".ase");
 		deft_sp.push(texture2);
 		meiko_sp.push(texture);
 	}
 	//存放用于显示在右上角的角色图片,由于_sp数组初始化后才有效,因此只能放在这里赋值.
 	hero_frames = {"deft":"deft_sp 0.ase","meiko":"meiko_sp 0.ase"};//{"deft":deft_sp[0],"meiko":meiko_sp[0]};

	//游戏开始界面
	gameScene = new Container();
	stage.addChild(gameScene);

	//层级初始化
	firGroup = new PIXI.display.Group(2, false);
	secGroup = new PIXI.display.Group(1, false);
	thiGroup = new PIXI.display.Group(0, false);
	fouGroup = new PIXI.display.Group(-1, false);
	bullteGroup = new PIXI.display.Group(-2, false);
	stage.addChild(new PIXI.display.Layer(firGroup));
	stage.addChild(new PIXI.display.Layer(secGroup));
	stage.addChild(new PIXI.display.Layer(thiGroup));
	stage.addChild(new PIXI.display.Layer(fouGroup));
	stage.addChild(new PIXI.display.Layer(bullteGroup));

	//提示界面
	gameHintScene = new Container();
	stage.addChild(gameHintScene);


	//游戏结束页面
	gameOverScene = new Container();
	stage.addChild(gameOverScene);

	gameOverScene.visible = false;
	endmsg = new Text(
		"The End!", 
		{font: "64px Futura", fontWeight: 'bold', stroke: '#4a1850',
		fill: ['#ffffff', '#ff0000'],strokeThickness: 5,
	    dropShadow: true,dropShadowColor: '#000000'}
		);
	endmsg.x = 450;
	endmsg.y = 280;
	endmsg.anchor.set(0.5);
	gameOverScene.addChild(endmsg);

	//下一关的按钮
	next = next_level();
	gameOverScene.addChild(next);

	bgaudio = document.createElement('audio');
	bgaudio.autoplay = true;
	document.body.appendChild(bgaudio);

	hitsound = document.createElement('audio');
	hitsound.src = "sounds/hit.mp3"
	hitsound.volume = 0.3;
	document.body.appendChild(hitsound);

	gameSet(0);
	gameLoop();
}
//从level.js中读取的游戏信息
var enemy_data,hint,bgaudio,hitsound;
//根据level初始化游戏？
function gameSet(level){
	//初始化背景音乐
	bgaudio.src = 'sounds/Another Day Of Sun.mp3';//这里放音乐的地址
	bgaudio.loop = true;
	// document.body.appendChild(bgaudio);

	//初始化/重置所有内容
	then = Date.now(),
	deltaTime = 7000,
	miss = 0,
	isStart = false,
	waves = 0,
	enemy_num = 0;
	playbg = false;
	//scene清空
	gameScene.removeChildren(0);
	gameHintScene.removeChildren(0);
	//初始化背景
	var background = new Sprite(resources["imgs/background_new.png"].texture);
	gameScene.addChild(background);

	//初始化右上角提示
	hint = new Text(
		"Holding", 
		{font: "60px Futura", fontWeight: 'bold', stroke: '#4a1850',
		fill: ['#ffffff', '#00ff99'],strokeThickness: 5,
	    dropShadow: true,dropShadowColor: '#000000'}
		);
	hint.x = 450;
	hint.y = 280;
	hint.anchor.set(0.5);
	gameHintScene.addChild(hint);
	gameHintScene.visible = false;

	//初始化放置hero的数组
	heros = new Array();
	for(var k=0;k<4;k++){
		heros[k]=[null,null,null,null,null];//new Array();
	}
	//初始化hero血量提示
	h_life_hint = new Array();
	for(var k = 0;k<4;k++){
		h_life_hint[k] = [null,null,null,null,null];
	}	
	//初始化子弹数组
	bullets = new Array();
	for(var k = 0;k<4;k++){
		bullets[k] = new Array();
	}
	//初始化敌人数组
	enemies = new Array();
	for(var k = 0;k<4;k++){
		enemies[k] = new Array();
	}
	//初始化敌人血量提示
	e_life_hint = new Array();
	for(var k = 0;k<4;k++){
		e_life_hint[k] = new Array();
	}	
	//根据传入的level从json数组defineLevels中获取游戏信息(目前主要为获取可选角色和敌人设置)
	var hero_atr = defineLevels[level].hero;//获取角色
	enemy_data = defineLevels[level].enemy_data;//获取敌人信息

	//初始化角色选择,hero用于存放左上角可供用户选择的角色,message用于存放角色的冷却时间提示
	for(var i = 0;i<hero_atr.length;i++){
		var oneHero = hero_creat(i,hero_atr[i].id,hero_atr[i].cold_time,hero_frames[hero_atr[i].id]);
		hero.push(oneHero);
		message.push(hero_message(oneHero));
		gameScene.addChild(oneHero);
	}
	//设置游戏开始
	state = play;

	//游戏启动
	// gameLoop();
}
function gameLoop(){
	// if(!gameOver){
		requestAnimationFrame(gameLoop);
		state();
		renderer.render(stage);
	// }
}
//then地方出现的间隔起始;deltaTime敌方出现的间隔;miss错过的敌方(游戏结束条件之一);
//isStart每一波敌人开始时初始化一次;waves当前为哪一波敌人,初始0;enemy_num当前波已填装的敌人(索引？)
var then, deltaTime, miss, isStart, waves, enemy_num;

function play() {
	var now = Date.now();
	//左上角角色冷却
	for(var i = 0;i<hero.length;i++){
		message[i].text = "冷却："+((hero[i].cold)?0:parseInt((hero[i].cold_time-(now-hero[i].current))/1000)+1);
		if(!hero[i].cold&&(now-hero[i].current)>hero[i].cold_time){
			hero[i].cold = true;
			hero[i].blendMode = PIXI.BLEND_MODES.NORMAL;
		}	
	}
	//生成敌人
	enemy_showup(now);
	//生成子弹
	bullet_showup();
	//四行的敌方&子弹前进
	for(var i = 0;i<4;i++){
		//每行敌人前进
		for(var j = 0;j<enemies[i].length;j++){
			//-------------------游戏失败条件-------------------
			if(enemies[i][j].x<=-80){
				state = end;
				endmsg.text = "Game Over!";
				next.visible = false;
				bgaudio.pause();
				bgaudio.src = "sounds/fail.mp3";
				return;
			};
			//--------------------判断敌人与角色的碰撞--------------------
			var index = Math.floor(enemies[i][j].x/120);
			//如果敌人所在之处有角色,判断碰撞发生
			if(index<5 && heros[i][index] != null){
				enemies[i][j].collipse = true;
				//目前发生碰撞时角色生命值递减,敌人不受影响
				if(heros[i][index].life>0){
					heros[i][index].life--;
					heros[i][index].alpha = 0.5;
					h_life_hint[i][index].text = parseInt(heros[i][index].life/50)+1;
					h_life_hint[i][index].style = {'font': "18px Futura",'fill':'black'};
					if(heros[i][index].life%50<20){
						h_life_hint[i][index].text = "-1";
						h_life_hint[i][index].style = {'font': "18px Futura",'fill':'red'};
						heros[i][index].alpha = 1;
					}
				}else{
					gameScene.removeChild(heros[i][index]);
					gameScene.removeChild(h_life_hint[i][index]);
					heros[i][index] = null;
					h_life_hint[i][index] = null;
					enemies[i][j].collipse = false;
				}
			}
			//--------------------判断每行子弹与每个敌人相撞--------------------
			for(var k = 0;k<bullets[i].length;k++){
				if(impact(enemies[i][j],bullets[i][k])){
					// alert(hitsound.volume);
					hitsound.load();
					hitsound.play();
					enemies[i][j].alpha = 0.5;
					//目前子弹杀伤力为1,所以--,以后伤害增加修改这里
					enemies[i][j].life -= bullets[i][k].power;
					//掉血提示
					e_life_hint[i][j].text="-"+bullets[i][k].power;
					e_life_hint[i][j].style = {'font': "18px Futura",'fill':'red'};
					//碰撞之后子弹消失
					gameScene.removeChild(bullets[i][k]);
					bullets[i].splice(k,1);
					//敌人生命不大于0则消失
					if(enemies[i][j].life<=0){
						//如果此时敌人与角色正在碰撞
						if(enemies[i][j].collipse){
							//角色状态复原
							heros[i][index].alpha = 1;
							h_life_hint[i][index].text = parseInt(heros[i][index].life/50)+1;
							h_life_hint[i][index].style = {'font': "18px Futura",'fill':'black'};
						}						
						gameScene.removeChild(enemies[i][j]);
						gameScene.removeChild(e_life_hint[i][j]);
						e_life_hint[i].splice(j,1);
						enemies[i].splice(j,1);
					}
				}			
			}
			//-------------------如果与角色碰撞,不再前进,直到角色消失-----------------
			if(heros[i][index] != null)
				continue;
			//-------------------敌人前进-------------------
			enemies[i][j].x-=enemies[i][j].speed;
			e_life_hint[i][j].x = enemies[i][j].x;
			//如果发生碰撞,持续一小段时间的透明
			if(enemies[i][j].alpha != 1){
				enemies[i][j].attacked--;
				e_life_hint[i][j].y -= 2;
				e_life_hint[i][j].alpha -= 0.1;
				if(enemies[i][j].attacked<=0){
					enemies[i][j].alpha = 1;
					enemies[i][j].attacked = 10;
					e_life_hint[i][j].y = enemies[i][j].y;
					e_life_hint[i][j].alpha =1;
					e_life_hint[i][j].text=enemies[i][j].life;
					e_life_hint[i][j].style = {'font': "18px Futura",'fill':'black'};
				}
			}
		}
		//-------------------每行子弹前进-------------------
		for(var j = 0;j<bullets[i].length;j++){
			//子弹前进
			bullets[i][j].x += bullets[i][j].speed;
			//子弹超出屏幕消失
			if(bullets[i][j].x>=860){
				gameScene.removeChild(bullets[i][j]);
				bullets[i].splice(j,1);
			}
		}
	}
	//-------------------游戏胜利条件,如果敌人出完,且四行均无敌人,判断胜利-------------------
	if(waves>=3&&enemies[0].length==0&&enemies[1].length==0&&enemies[2].length==0&&enemies[3].length==0){
		state = end;
		endmsg.text = "Victory!";
		next.level++;
		bgaudio.pause();
		bgaudio.src = "sounds/victory.mp3";
	}
}
function enemy_showup(now){
	//敌方出现间隔，新增敌人
	var delta = now-then;
	if(!isStart){
		if(enemies[0].length!=0||enemies[1].length!=0||enemies[2].length!=0||enemies[3].length!=0){
			return;
		}		
	}
	if(delta>deltaTime&&waves<enemy_data.length){
		if(!isStart){
			hint.text = enemy_data[waves].text;//右上角提示内容
			deltaTime = enemy_data[waves].delta;//每波敌人的出现间隔
			isStart = true;//已初始化上面两个内容
			gameHintScene.visible = true;
			then = now;
			return;
		}
		gameHintScene.visible = false;
		then = now;
		var randomNum = Math.floor(Math.random()*4);
		var e_hint;

		var enemy;//每次生成的敌人种类由json中读取
		switch(enemy_data[waves].enemy[enemy_num]){
			case 'slm':
				enemy = slm_creat(900, places_y[3-randomNum]);
				enemy_num++;
				break;
			case 'green_slm':
				enemy = green_slm_creat(900, places_y[3-randomNum]);
				enemy_num++;
				break;
			default:
				enemy = slm_creat(900, places_y[3-randomNum]);		
				enemy_num++;
				break;
		}
		//放置在对应图层中
		switch(randomNum){
			case 0:
				enemy.parentGroup = fouGroup;
				break;
			case 1:
				enemy.parentGroup = thiGroup;
				break;
			case 2:
				enemy.parentGroup = secGroup;
				break;
			case 3:
				enemy.parentGroup = firGroup;
				break;
		}

		e_hint = new Text(
			enemy.life+"", 
			{font: "18px Futura", fill: "black",background:"red"}
			);
		e_hint.anchor.set(1);
		e_hint.x = 900;
		e_hint.y = places_y[3-randomNum];	

		e_life_hint[randomNum].push(e_hint);
		enemies[randomNum].push(enemy);
		gameScene.addChild(enemy);
		gameScene.addChild(e_hint);
		enemy_data[waves].sum--;
		//当前波敌人出完之后开启下一波敌人
		if(enemy_data[waves].sum<=0){
			waves++;
			enemy_num = 0;
			deltaTime = 7000;
			isStart = false;
		}
	}	
}
function bullet_showup(){
	//子弹出现间隔，新增子弹
	for(var i = 0;i<4;i++){
		for(var j = 0;j<5;j++){
			//如果位置上没有角色,不产生子弹
			if(heros[i][j]==null)
				continue;
			//如果有角色,则间隔count次产生一个子弹
			if(heros[i][j].count<=0){
				var bullet;
				switch(heros[i][j].id){
					case "meiko":
						bullet = bullet_heart_creat(heros[i][j].x+85,heros[i][j].y);
						break;
					case "deft":
						bullet = bullet_creat(heros[i][j].x+85,heros[i][j].y);
						break;
					default:
						bullet = bullet_creat(heros[i][j].x+85,heros[i][j].y);
						break;
				}
				bullets[i].push(bullet);
				gameScene.addChild(bullet);
				heros[i][j].count = heros[i][j].original_count;
			}else{
				heros[i][j].count--;
			}
		}
	}	
}
function impact(obj, dobj) { 
	var o = { 
		x: obj.x, 
		w: obj.x+obj.width
	} 

	var d = { 
		x: dobj.x, 
		w: dobj.x+dobj.width
	} 

	if(o.x>d.w||o.w<d.x){
		return false; 
	} else{ 
		return true; 
	}  
}
var endtime = 100,fontsize = 10,playbg = false;
function end() {
	// gameScene.visible = false;
	gameHintScene.visible = false;
	endtime--;
	if(endtime<=0){
		if(!playbg){
			bgaudio.play();
			bgaudio.loop = false;
			playbg = true;
		}
		gameOverScene.visible = true;
		if(fontsize<=120){
			endmsg.style.fontSize=fontsize;
			fontsize += 3;
		}
	}
}