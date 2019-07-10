(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

var globalSettings = {
	width 			: 1000,
    height			: 500,
    defaultWidth	: 1000,
    defaultHeight	: 500,
	scale			: 1,
	state			: "menu"
};

var menu = {
	"types" 			: ["main", "levels", "settings"],
	"currentType"		: "main",
	"active"			: true,
	"mainItems"			: [],
	"levelItems"		: [],
	"settingsItems"		: [],
	"lvlPositions"		: [
		[250, 130], [350, 130], [450, 130], [550, 130], [650, 130], 
		[250, 220], [350, 220], [450, 220], [550, 220], [650, 220], 
		[250, 310], [350, 310], [450, 310], [550, 310], [650, 310],
		[250, 400]
	]
};

var game = {
    currentLevel	: 1,
	maxLevel		: 16,
	completedLvls	: [],
	gravity			: 0.3,
	defaultGravity	: 0.3,
	friction		: 0.8,
	defaultFriction	: 0.8,
    death			: 0,
    bounces			: 0,
    points			: 0,
    levelBonus		: 0,
	active			: false,
	bonusTimer		: 0,
	resetBonus		: false
};
var player = [], keys = [], boxes = [], goals = [], hazards = [], bonus = [];

function Scale(prop){
	return prop*globalSettings.scale;
}

function ScaleCanvas(){
	//work out scale
	globalSettings.scale = window.innerWidth / 1000;
	
	//scale canvas
	while ((globalSettings.defaultHeight * globalSettings.scale) > window.innerHeight){
		globalSettings.scale = globalSettings.scale - 0.01;
	}
	if (globalSettings.scale > 1){
		globalSettings.scale = 1;
	}
	globalSettings.width = Scale(globalSettings.defaultWidth);
	globalSettings.height = Scale(globalSettings.defaultHeight);
	//game.friction = Scale(game.friction); //DONT NEED TO SCALE game.friction
	game.gravity = Scale(game.defaultGravity);
	
	//set canvas and touch input to game size
	canvas.width = globalSettings.width;
	canvas.height = globalSettings.height;
	document.getElementById("touchLeft").style.width = globalSettings.width/2+"px";
	document.getElementById("touchLeft").style.height = globalSettings.height+"px";
	document.getElementById("touchRight").style.width = globalSettings.width/2+"px";
	document.getElementById("touchRight").style.left = globalSettings.width/2+"px";
	document.getElementById("touchRight").style.height = globalSettings.height+"px";
	document.getElementById("pc").style.width = globalSettings.width+"px";
	document.getElementById("pc").style.marginTop = ((window.innerHeight-globalSettings.height)/2)+"px";
}

function ScaleObjects(ob){
	for (var i = 0; i < ob.length; i++){
		ob[i].x = Scale(ob[i].x);
		ob[i].y = Scale(ob[i].y);
		ob[i].width = Scale(ob[i].width);
		ob[i].height = Scale(ob[i].height);
		ob[i].speed = Scale(ob[i].speed);
		ob[i].xMaxLimit = Scale(ob[i].xMaxLimit);
		ob[i].xMinLimit = Scale(ob[i].xMinLimit);
		ob[i].yMaxLimit = Scale(ob[i].yMaxLimit);
		ob[i].yMinLimit = Scale(ob[i].yMinLimit);
	}
}

function ScalePlayer(pl){
	pl.x = Scale(pl.x);
	pl.y = Scale(pl.y);
	pl.width = Scale(pl.width);
	pl.height = Scale(pl.height);
	pl.speed = Scale(pl.speed);
}

function updateMenu(){
	clearCanvas();
///////////////////////////////////////////////////// Draw Menu Items /////////////////////////////////////////////////////
	switch(menu.currentType){
		case "main":
			for (var i = 0; i < menu.mainItems.length; i++) {
				ctx.font = Scale(menu.mainItems[i].fontSize)+"px Arial";
				ctx.fillStyle = menu.mainItems[i].color;
				ctx.textAlign = menu.mainItems[i].textAlign;
				ctx.fillText(menu.mainItems[i].text, Scale(menu.mainItems[i].x), Scale(menu.mainItems[i].y));
			}
			break;

		case "levels":
			for (var i = 0; i < menu.levelItems.length; i++) {
				if (menu.levelItems[i].text === "lvls"){
					for (var j = 1; j <= game.maxLevel; j++){
						var curLvl = (j < 10) ? "0"+j : j;
						var lvlColor = (game.completedLvls.indexOf(j) > -1) ? "#3ed47a" : menu.levelItems[i].color;
						ctx.font = Scale(menu.levelItems[i].fontSize)+"px Arial";
						ctx.fillStyle = lvlColor;
						ctx.textAlign = menu.levelItems[i].textAlign;
						ctx.fillText("Lvl "+curLvl, Scale(menu.lvlPositions[j-1][0]), Scale(menu.lvlPositions[j-1][1]));
					}
				} else {
					ctx.font = Scale(menu.levelItems[i].fontSize)+"px Arial";
					ctx.fillStyle = menu.levelItems[i].color;
					ctx.textAlign = menu.levelItems[i].textAlign;
					ctx.fillText(menu.levelItems[i].text, Scale(menu.levelItems[i].x), Scale(menu.levelItems[i].y));
				}
			}
			break;

		case "settings":
			break;
	};

///////////////////////////////////////////////////// Update Menu /////////////////////////////////////////////////////////
	if (menu.active){
		requestAnimationFrame(updateMenu);
	}
}

function updateGame(){
///////////////////////////////////////////////////// input ///////////////////////////////////////////////////////////////
    if (keys[39]) {
        // right arrow
        if (player.velX < player.speed) {
        	player.velX++;
        }
        if ((player.x + player.width) >= globalSettings.width){
        	player.velX = 0;
        }
    }
    if (keys[37]) {
    	// left arrow
        if (player.velX > -player.speed) {
            player.velX--;
        }
        if (player.x <= 0){
        	player.velX = 0;
        }
	}
	
	if (player.y <= 0){
		player.velY = 0;
	}
 
    player.velX *= game.friction;
    player.velY += game.gravity;
 
///////////////////////////////////////////////////// draw objects ////////////////////////////////////////////////////////
	clearCanvas();
    //Level number background
	ctx.font = Scale(550)+"px Arial";
	ctx.fillStyle = "#0f0f0f";
	ctx.textAlign="center";
	ctx.fillText(game.currentLevel, globalSettings.width/2, Scale(430));
 
    player.grounded = false;
    for (var i = 0; i < boxes.length; i++) {
    	ctx.fillStyle = boxes[i].colour;
        ctx.fillRect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
        //ctx.drawImage(img, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
 		
 		MoveObject(boxes[i]);
 		
        var dir = colCheck(player, boxes[i]);
 		
 		if (dir === "l" || dir === "r" || dir === "b"){
 			if (boxes[i].speed > 0){
 				if (boxes[i].dir === "r"){
 					player.x += boxes[i].speed;
 				} else if (boxes[i].dir === "l"){
 					player.x += -boxes[i].speed;
 				}
 			}
 		}
 		
        if (dir === "l" || dir === "r") {
            player.velX = 0;
            //player.jumping = false;
        } else if (dir === "b") {
            //player.grounded = true;
            //player.jumping = false;
            Jump();
            game.bounces++;
        } else if (dir === "t") {
            player.velY *= -1;
        }
    }
    
    for (var i = 0; i < hazards.length; i++) {
    	ctx.fillStyle = hazards[i].colour;
        ctx.fillRect(hazards[i].x, hazards[i].y, hazards[i].width, hazards[i].height);
 		
 		MoveObject(hazards[i]);
 		
        var dir = colCheck(player, hazards[i]);
 		
 		if (dir === "l" || dir === "r" || dir === "b" || dir === "t"){
 			if (game.active){
	 			//dead
	 			game.active = false;
	 			ctx.clearRect(0, 0, globalSettings.width, globalSettings.height);
	 			game.death++;
	 			game.points -= game.levelBonus;
	 			LoadLevel(game.currentLevel);
 			}
 		}
    }
    
    for (var i = 0; i < goals.length; i++){
    	ctx.fillStyle = goals[i].colour;
    	ctx.fillRect(goals[i].x, goals[i].y, goals[i].width, goals[i].height);
    	
    	MoveObject(goals[i]);
    	
    	var dir = colCheck(player, goals[i]);
    	
    	if (dir === "l" || dir === "r" || dir === "t" || dir === "b"){
    		if (game.active){
				game.death = 0;
				game.completedLvls.push(game.currentLevel);
				LoadMenu("levels");
    		}
    	}
    }
    
    for (var i = 0; i < bonus.length; i++){
    	ctx.fillStyle = bonus[i].colour;
    	ctx.fillRect(bonus[i].x, bonus[i].y, bonus[i].width, bonus[i].height);
    	
    	MoveObject(bonus[i]);
    	
    	var dir = colCheck(player, bonus[i]);
    	
    	if (dir === "l" || dir === "r" || dir === "t" || dir === "b"){
    		bonus[i].x = 2000;
    		bonus[i].y = 2000;
    		game.points += bonus[i].value;
			game.levelBonus += bonus[i].value;
			
			game.resetBonus = false;
			GravityBonus();
    	}
    }
    
    //////////////////////////////////////////////// player movement /////////////////////////////////////////////////////
 
    if(player.grounded){
         player.velY = 0;
    }
    
    SetTail();
    
    player.x += player.velX;
	player.y += player.velY;	
 
    ctx.fillStyle = player.colour;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    DrawTail();
    
///////////////////////////////////////////////////// Draw game text //////////////////////////////////////////////////////
	ctx.font = Scale(20)+"px Arial";
	ctx.fillStyle = "#fff";
	ctx.textAlign = "start";
	//ctx.fillText("Points: "+game.points, Scale(10), Scale(30));
	ctx.fillText("Bounces: "+game.bounces, Scale(10), Scale(55));
	ctx.fillText("Deaths: "+game.death, Scale(10), Scale(80));

///////////////////////////////////////////////////// Draw Bonus Timer ////////////////////////////////////////////////////
	if (game.bonusTimer > 0){
		ctx.font = Scale(20)+"px Arial";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "start";
		ctx.fillText(game.bonusTimer, (player.x), (player.y - 10));
	}
///////////////////////////////////////////////////// Update Game /////////////////////////////////////////////////////////
	if (game.active){
		requestAnimationFrame(updateGame);
	}
}

function clearCanvas(){
	ctx.clearRect(0, 0, globalSettings.width, globalSettings.height);
    //draw background colour
    ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, globalSettings.width, globalSettings.height);
}

function MoveObject(Ob){
	if (Ob.dir === "r"){
		Ob.x += Ob.speed;
		if (Ob.x >= (Ob.xMaxLimit - Ob.width)){
			Ob.dir = "l";
		}
	} else if (Ob.dir === "l"){
		Ob.x -= Ob.speed;
		if (Ob.x <= Ob.xMinLimit){
			Ob.dir = "r";
		}
	} else if (Ob.dir === "u"){
		Ob.y -= Ob.speed;
		if (Ob.y <= Ob.yMinLimit){
			Ob.dir = "d";
		}
	} else if (Ob.dir === "d"){
		Ob.y += Ob.speed;
		if (Ob.y >= (Ob.yMaxLimit - Ob.height)){
			Ob.dir = "u";
		}
	}
}

function Jump(){
	player.jumping = true;
    player.grounded = false;
    player.velY = -player.speed * 2;
}
 
function colCheck(shapeA, shapeB) {
    // get the vectors to check against
    var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)),
        vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)),
        // add the half widths and half heights of the objects
        hWidths = (shapeA.width / 2) + (shapeB.width / 2),
        hHeights = (shapeA.height / 2) + (shapeB.height / 2),
        colDir = null;
 
    // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
    	// figures out on which side we are colliding (top, bottom, left, or right)
    	var oX = hWidths - Math.abs(vX),
    		oY = hHeights - Math.abs(vY);
    	if (oX >= oY) {
            if (vY > 0) {
                colDir = "t";
                shapeA.y += oY;
            } else {
                colDir = "b";
                shapeA.y -= oY;
            }
        } else {
            if (vX > 0) {
                colDir = "l";
                shapeA.x += oX;
            } else {
                colDir = "r";
                shapeA.x -= oX;
            }
        }
    }
    return colDir;
}

function SetTail(){
	
	player.prevX6 = player.prevX5;
    player.prevX5 = player.prevX4;
	player.prevX4 = player.prevX3;
	player.prevX3 = player.prevX2;
	player.prevX2 = player.prevX1;
	player.prevX1 = player.x;
	
	player.prevY6 = player.prevY5;
	player.prevY5 = player.prevY4;
	player.prevY4 = player.prevY3;
	player.prevY3 = player.prevY2;
	player.prevY2 = player.prevY1;
	player.prevY1 = player.y;
}

function DrawTail(){
	ctx.fillStyle = "rgba(236,208,120,0.2)";
    ctx.fillRect(player.prevX1 + ((player.width-(player.width*0.9))/2), player.prevY1 + ((player.height-(player.height*0.9))/2), player.width*0.9, player.height*0.9);
    ctx.fillRect(player.prevX2 + ((player.width-(player.width*0.8))/2), player.prevY2 + ((player.height-(player.height*0.8))/2), player.width*0.8, player.height*0.8);
    ctx.fillRect(player.prevX3 + ((player.width-(player.width*0.7))/2), player.prevY3 + ((player.height-(player.height*0.7))/2), player.width*0.7, player.height*0.7);
    ctx.fillRect(player.prevX4 + ((player.width-(player.width*0.6))/2), player.prevY4 + ((player.height-(player.height*0.6))/2), player.width*0.6, player.height*0.6);
	ctx.fillRect(player.prevX5 + ((player.width-(player.width*0.5))/2), player.prevY5 + ((player.height-(player.height*0.5))/2), player.width*0.5, player.height*0.5);
	ctx.fillRect(player.prevX6 + ((player.width-(player.width*0.4))/2), player.prevY6 + ((player.height-(player.height*0.4))/2), player.width*0.4, player.height*0.4);
}

function GravityBonus(timer){
	timer = (typeof timer !== 'undefined') ?  timer : 5;
	if (!game.resetBonus){
		game.bonusTimer = timer;
		if (timer > 0){
			game.gravity = Scale(game.defaultGravity/4);
			window.setTimeout(function(){
				GravityBonus(timer-1);
			}, 1000);
		} else {
			ResetBonus();
		}
	}
}

function ResetBonus(){
	game.bonusTimer = 0;
	game.gravity = Scale(game.defaultGravity);
	game.resetBonus = true;
}

function LoadMenu(menuType){
	menu.active = true;
	game.active = false;
	globalSettings.state = "menu";
	ToggleTouchInputs(false);
	menu.currentType = menuType;

	var cache = new Date().getTime();
	var menuReq = new XMLHttpRequest();
	var url = "menus/main/items.txt?cache="+cache;
	menuReq.onreadystatechange = function() {
		if (menuReq.readyState == 4 && menuReq.status == 200) {
			menu.mainItems = JSON.parse(menuReq.responseText);
			
			var menuLevelsReq = new XMLHttpRequest();
			url = "menus/levels/items.txt?cache="+cache;
			menuLevelsReq.onreadystatechange = function(){
				if (menuLevelsReq.readyState == 4 && menuLevelsReq.status == 200) {
					menu.levelItems = JSON.parse(menuLevelsReq.responseText);

					var menuSettingsReq = new XMLHttpRequest();
					url = "menus/settings/items.txt?cache="+cache;
					menuSettingsReq.onreadystatechange = function(){
						if (menuSettingsReq.readyState == 4 && menuSettingsReq.status == 200) {
							menu.settingsItems = JSON.parse(menuSettingsReq.responseText);
							updateMenu();
						}
					};
					menuSettingsReq.open("GET", url, true);
					menuSettingsReq.send();
				}
			};
			menuLevelsReq.open("GET", url, true);
			menuLevelsReq.send();
		}
	};
	menuReq.open("GET", url, true);
	menuReq.send();
}

function StartGame(){
	menu.active = false;
	globalSettings.state = "game";
	ToggleTouchInputs(true);
	LoadLevel(game.currentLevel);
}

function ToggleTouchInputs(show){
	document.getElementById("touchLeft").style.display = document.getElementById("touchRight").style.display = (show) ? "block" : "none";
}

function LoadLevel(lvl){
	console.log("Loading level: "+lvl);
	lvl = (lvl < 10) ? "0"+lvl : lvl;
	game.levelBonus = 0;
	game.bounces = 0;
	ResetBonus();
	var cache = new Date().getTime();
	var boxReq = new XMLHttpRequest();
	var url = "levels/level"+lvl+"/box.txt?cache="+cache;
	boxReq.onreadystatechange = function() {
		if (boxReq.readyState == 4 && boxReq.status == 200) {
			boxes = JSON.parse(boxReq.responseText);
			ScaleObjects(boxes);
			var goalReq = new XMLHttpRequest();
			url = "levels/level"+lvl+"/goal.txt?cache="+cache;
			goalReq.onreadystatechange = function() {
				if (goalReq.readyState == 4 && goalReq.status == 200) {
					goals = JSON.parse(goalReq.responseText);
					ScaleObjects(goals);
					var hazardReq = new XMLHttpRequest();
					url = "levels/level"+lvl+"/hazard.txt?cache="+cache;
					hazardReq.onreadystatechange = function() {
						if (hazardReq.readyState == 4 && hazardReq.status == 200) {
							hazards = JSON.parse(hazardReq.responseText);
							ScaleObjects(hazards);
							var playerReq = new XMLHttpRequest();
							url = "levels/level"+lvl+"/player.txt?cache="+cache;
							playerReq.onreadystatechange = function() {
								if (playerReq.readyState == 4 && playerReq.status == 200) {
									player = JSON.parse(playerReq.responseText);
									ScalePlayer(player);
									var bonusReq = new XMLHttpRequest();
									url = "levels/level"+lvl+"/bonus.txt?cache="+cache;
									bonusReq.onreadystatechange = function() {
										if (bonusReq.readyState == 4 && bonusReq.status == 200) {
											bonus = JSON.parse(bonusReq.responseText);
											ScaleObjects(bonus);
											if (!game.active){
												game.active = true;
												updateGame();
											}
										}
									};
									bonusReq.open("GET", url, true);
									bonusReq.send();
								}
							};
							playerReq.open("GET", url, true);
							playerReq.send();
						}
					};
					hazardReq.open("GET", url, true);
					hazardReq.send();
				}
			};
			goalReq.open("GET", url, true);
			goalReq.send();
		}
	};
	boxReq.open("GET", url, true);
	boxReq.send();
}

function ResetGame(){
	game.currentLevel = 1;
	game.death = 0;
	game.bounces = 0;
}

//menu navigation
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
}

function canvasTouch(e){
	if (menu.active){
		var mousePos = getMousePos(canvas, e);
		
		switch(menu.currentType){
			case "main":
				for (var i = 0; i < menu.mainItems.length; i++) {
					var xPos = (menu.mainItems[i].textAlign === "start") ? menu.mainItems[i].x : (menu.mainItems[i].x - (menu.mainItems[i].width/2));
					var rect = {
						x:		Scale(xPos),
						y:		Scale(menu.mainItems[i].y - menu.mainItems[i].height),
						width:	Scale(menu.mainItems[i].width),
						height:	Scale(menu.mainItems[i].height)
					};
					if (isInside(mousePos,rect)) {
						switch (menu.mainItems[i].nav){
							case "start":
								game.currentLevel = 1;
								StartGame();
								break;
							case "levelsMenu":
								LoadMenu("levels");
								break;
							case "settingsMenu":
								break;
						};
					}
				}
				break;
	
			case "levels":
				for (var i = 0; i < menu.levelItems.length; i++) {
					if (menu.levelItems[i].text === "lvls"){
						for (var j = 1; j <= game.maxLevel; j++){
							var xPos = (menu.levelItems[i].textAlign === "start") ? menu.lvlPositions[j-1][0] : (menu.lvlPositions[j-1][0] - (menu.levelItems[i].width/2));
							var rect = {
								x:		Scale(xPos),
								y:		Scale(menu.lvlPositions[j-1][1] - menu.levelItems[i].height),
								width:	Scale(menu.levelItems[i].width),
								height:	Scale(menu.levelItems[i].height)
							};
							console.dir(rect);
							if (isInside(mousePos,rect)) {
								game.currentLevel = j;
								StartGame();
							}
						}
					}
				}
				break;
	
			case "settings":
				break;
		};  
	}
}

//event listeners
document.body.addEventListener("keydown", function (e) {
    keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function (e) {
    keys[e.keyCode] = false;
});
document.getElementById("touchLeft").addEventListener("touchstart", function(e){
	keys[37] = true;
});
document.getElementById("touchLeft").addEventListener("touchend", function(e){
	keys[37] = false;
});
document.getElementById("touchRight").addEventListener("touchstart", function(e){
	keys[39] = true;
});
document.getElementById("touchRight").addEventListener("touchend", function(e){
	keys[39] = false;
});
window.addEventListener("resize", function(e){
	ScaleCanvas();
	if(game.active){
		StartGame();
	}
}); 
window.addEventListener("load", function () {
	ScaleCanvas();
	LoadMenu("main");
});
canvas.addEventListener("click", function(e){
	canvasTouch(e);
}, false);
canvas.addEventListener("touchend", function(e){
	canvasTouch(e);
}, false);