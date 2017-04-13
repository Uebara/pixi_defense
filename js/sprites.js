function bullet_creat(x,y){
	var bullet = PIXI.Sprite.fromImage('imgs/bullet_ball.png');
	bullet.x = x;
	bullet.y = y;	
	bullet.power = 1;
	bullet.speed = 0.9;
	bullet.parentGroup = bullteGroup;
	return bullet;
}

function bullet_heart_creat(x,y){
	var bullet = PIXI.MovieClip.fromFrames(b_heart_sp);
	bullet.position.set(x, y);
	bullet.animationSpeed = 0.1;
	bullet.play();
	bullet.loop = true;

	bullet.power = 2;
	bullet.speed = 1;
	bullet.parentGroup = bullteGroup;
	return bullet;
}

function meiko_creat(x,y){
	var role = new PIXI.extras.AnimatedSprite(meiko_sp);
	role.position.set(x, y);
	role.animationSpeed = 0.08;
	role.anchor.set(0,0.5);
	role.play();
	role.loop = true;

	role.id = "meiko"
	role.original_count = 400;
	role.count = 400;
	role.life = 200;	//200次相当于4秒
	return role;	
}

function deft_creat(x,y){
	// var role = PIXI.MovieClip.fromFrames(deft_sp);
	var role = new PIXI.extras.AnimatedSprite(deft_sp);	
	role.position.set(x, y);
	role.animationSpeed = 0.08;
	role.anchor.set(0,0.5);
	role.play();
	role.loop = true;

	role.id = "deft";
	role.original_count = 350;
	role.count = 350;
	role.life = 100;	
	return role;	
}

function slm_creat(x,y){
	var slm = PIXI.MovieClip.fromFrames(enemy_imgs);
	slm.position.set(x, y);
	slm.animationSpeed = 0.15;
	slm.anchor.set(0,0.5);
	slm.play();
	slm.loop = true;

	slm.point = 1;
	slm.speed = 0.5;
	slm.life = 3;
	slm.attacked = 10;
	slm.collipse = false;
	return slm;
}

function green_slm_creat(x,y){
	var slm = PIXI.MovieClip.fromFrames(green_slm_sp);
	slm.position.set(x, y);
	slm.animationSpeed = 0.15;
	slm.anchor.set(0,0.5);
	slm.play();
	slm.loop = true;

	slm.point = 1;
	slm.speed = 0.6;
	slm.life = 5;
	slm.attacked = 10;
	slm.collipse = false;
	return slm;
}

//左上角的可选角色创建
function hero_creat(i,id,cold_time,hero_frame){
	var hero = PIXI.Sprite.fromFrame(hero_frame);
	hero.id = id;
	hero.origin_x = 50+i*85;
	hero.x = 50+i*85;
	hero.y = 60;
	hero.blendMode = PIXI.BLEND_MODES.SCREEN;
	hero.cold = false;
	hero.cold_time = cold_time;
	hero.current = Date.now();
	subscribe(hero);
	return hero;
}

//与hero_creat绑定,生成冷却提示信息
function hero_message(hero){
	var hero_message = new Text(
		"冷却中", 
		{font: "18px sans-serif", fill: "black"}
		);
	hero_message.position.set(hero.x-30, hero.y+50);
	gameScene.addChild(hero_message);
	return hero_message;
}

function subscribe(obj) {
    // enable the bunny to be interactive... this will allow it to respond to mouse and touch events
    obj.interactive = true;
    // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
    obj.buttonMode = true;
    // center the bunny's anchor point
    obj.anchor.set(0.5);
    // make it a bit bigger, so it's easier to grab
    // obj.scale.set(3);
    obj
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
}
function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    if(!this.cold)
    	return;
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
}
function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;
    var flag = false;
    if(this.y>460&&this.cold){
    	flag = putHero(this.id,0,Math.floor(this.x/120),fouGroup);
    }else if(this.y>380&&this.cold){
    	flag = putHero(this.id,1,Math.floor(this.x/120),thiGroup);
    }else if(this.y>300&&this.cold){
    	flag = putHero(this.id,2,Math.floor(this.x/120),secGroup);
    }else if(this.y>220&&this.cold){
		flag = putHero(this.id,3,Math.floor(this.x/120),firGroup);
    }
    //flag=false表示放置失败,可能未放到合适区域,可能放置处已有其他角色
    if(flag){
		this.x = this.origin_x;
		this.y = 60;
	    this.blendMode = PIXI.BLEND_MODES.SCREEN;
	    this.cold = false;
	    this.current = Date.now();
    }else{
		this.x = this.origin_x;
		this.y = 60;
	}
}
function putHero(id,y_index,x_index,group){
	//如果当前位置已放置角色,直接返回
	if(heros[y_index][x_index] != null)
		return false;
	var role,h_hint;
	//根据传入的id(从json中获取,这段有点绕,总之不出意外不需要考虑)创建对应的角色
	switch(id){
		case 'deft':
			role = deft_creat(places_x[x_index]+20,places_y[3-y_index],1);
			break;
		case 'meiko':
			role = meiko_creat(places_x[x_index]+20,places_y[3-y_index],1);
		}
	h_hint = new Text(
		parseInt(role.life/50), 
		{font: "18px Futura", fill: "black"}
	);
	h_hint.anchor.set(1);
	h_hint.x = places_x[x_index]+20;
	h_hint.y = places_y[3-y_index];				
    role.parentGroup = group;
    heros[y_index][x_index] = role;
    h_life_hint[y_index][x_index] = h_hint;
   	gameScene.addChild(role);
   	gameScene.addChild(h_hint);
   	return true;
}
function onDragMove() {
    if (this.dragging) {
        var newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
    }
}

//下一关按钮
function next_level(){
	var next = PIXI.Sprite.fromImage('imgs/next.png');
	next.x = 700;
	next.y = 400;
	next.level = 0;
	next_subscribe(next);
	return next;
}

function next_subscribe(obj) {
    // enable the bunny to be interactive... this will allow it to respond to mouse and touch events
    obj.interactive = true;
    // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
    obj.buttonMode = true;
    obj.on('pointerdown', onNextLevel);
}
function onNextLevel(event) {
	//如果关卡大于json中的关卡数,弹出提示
	if(this.level >= defineLevels.length){
		alert("Coming Soon!");
		return;
	}
	//否则开启下一关游戏
	// gameScene.visible = true;
	gameOverScene.visible = false;
	endtime = 100;
	fontsize = 10;
	gameSet(this.level);
}