(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

//HTML element mappings
var htmlElements = {
	canvas 				: document.getElementById("gameCanvas"),
	ctx 				: document.getElementById("gameCanvas").getContext("2d"),
	leftTouchContainer 	: document.getElementById("touchLeft"),
	rightTouchContainer : document.getElementById("touchRight"),
	pageContainer 		: document.getElementById("pc")
};	

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

function scale(prop){
	return prop*globalSettings.scale;
}

function scaleCanvas(){
	//work out scale
	globalSettings.scale = window.innerWidth / 1000;
	
	//scale canvas
	while ((globalSettings.defaultHeight * globalSettings.scale) > window.innerHeight){
		globalSettings.scale = globalSettings.scale - 0.01;
	}
	if (globalSettings.scale > 1){
		globalSettings.scale = 1;
	}
	globalSettings.width = scale(globalSettings.defaultWidth);
	globalSettings.height = scale(globalSettings.defaultHeight);
	//game.friction = scale(game.friction); //DONT NEED TO SCALE game.friction
	game.gravity = scale(game.defaultGravity);
	
	//set canvas and touch input to game size
	htmlElements.canvas.width = globalSettings.width;
	htmlElements.canvas.height = globalSettings.height;
	htmlElements.leftTouchContainer.style.width = globalSettings.width/2+"px";
	htmlElements.leftTouchContainer.style.height = globalSettings.height+"px";
	htmlElements.rightTouchContainer.style.width = globalSettings.width/2+"px";
	htmlElements.rightTouchContainer.style.left = globalSettings.width/2+"px";
	htmlElements.rightTouchContainer.style.height = globalSettings.height+"px";
	htmlElements.pageContainer.style.width = globalSettings.width+"px";
	htmlElements.pageContainer.style.marginTop = ((window.innerHeight-globalSettings.height)/2)+"px";
}

function scaleObjects(ob){
	for (var i = 0; i < ob.length; i++){
		ob[i].x = scale(ob[i].x);
		ob[i].y = scale(ob[i].y);
		ob[i].width = scale(ob[i].width);
		ob[i].height = scale(ob[i].height);
		ob[i].speed = scale(ob[i].speed);
		ob[i].xMaxLimit = scale(ob[i].xMaxLimit);
		ob[i].xMinLimit = scale(ob[i].xMinLimit);
		ob[i].yMaxLimit = scale(ob[i].yMaxLimit);
		ob[i].yMinLimit = scale(ob[i].yMinLimit);
	}
}

function scalePlayer(pl){
	pl.x = scale(pl.x);
	pl.y = scale(pl.y);
	pl.width = scale(pl.width);
	pl.height = scale(pl.height);
	pl.speed = scale(pl.speed);
}

function updateMenu(){
	clearCanvas();
///////////////////////////////////////////////////// Draw Menu Items /////////////////////////////////////////////////////
	switch(menu.currentType){
		case "main":
			for (var i = 0; i < menu.mainItems.length; i++) {
				htmlElements.ctx.font = scale(menu.mainItems[i].fontSize)+"px Arial";
				htmlElements.ctx.fillStyle = menu.mainItems[i].color;
				htmlElements.ctx.textAlign = menu.mainItems[i].textAlign;
				htmlElements.ctx.fillText(menu.mainItems[i].text, scale(menu.mainItems[i].x), scale(menu.mainItems[i].y));
			}
			break;

		case "levels":
			for (var i = 0; i < menu.levelItems.length; i++) {
				if (menu.levelItems[i].text === "lvls"){
					for (var j = 1; j <= game.maxLevel; j++){
						var curLvl = (j < 10) ? "0"+j : j;
						var lvlColor = (game.completedLvls.indexOf(j) > -1) ? "#3ed47a" : menu.levelItems[i].color;
						htmlElements.ctx.font = scale(menu.levelItems[i].fontSize)+"px Arial";
						htmlElements.ctx.fillStyle = lvlColor;
						htmlElements.ctx.textAlign = menu.levelItems[i].textAlign;
						htmlElements.ctx.fillText("Lvl "+curLvl, scale(menu.lvlPositions[j-1][0]), scale(menu.lvlPositions[j-1][1]));
					}
				} else {
					htmlElements.ctx.font = scale(menu.levelItems[i].fontSize)+"px Arial";
					htmlElements.ctx.fillStyle = menu.levelItems[i].color;
					htmlElements.ctx.textAlign = menu.levelItems[i].textAlign;
					htmlElements.ctx.fillText(menu.levelItems[i].text, scale(menu.levelItems[i].x), scale(menu.levelItems[i].y));
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
	htmlElements.ctx.font = scale(550)+"px Arial";
	htmlElements.ctx.fillStyle = "#303030";
	htmlElements.ctx.textAlign="center";
	htmlElements.ctx.fillText(game.currentLevel, globalSettings.width/2, scale(430));
 
    player.grounded = false;
    for (var i = 0; i < boxes.length; i++) {
    	htmlElements.ctx.fillStyle = boxes[i].colour;
        htmlElements.ctx.fillRect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
        //htmlElements.ctx.drawImage(img, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
 		
 		moveObject(boxes[i]);
 		
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
            jump();
            game.bounces++;
        } else if (dir === "t") {
            player.velY *= -1;
        }
    }
    
    for (var i = 0; i < hazards.length; i++) {
    	htmlElements.ctx.fillStyle = hazards[i].colour;
        htmlElements.ctx.fillRect(hazards[i].x, hazards[i].y, hazards[i].width, hazards[i].height);
 		
 		moveObject(hazards[i]);
 		
        var dir = colCheck(player, hazards[i]);
 		
 		if (dir === "l" || dir === "r" || dir === "b" || dir === "t"){
 			if (game.active){
	 			//dead
	 			game.active = false;
	 			htmlElements.ctx.clearRect(0, 0, globalSettings.width, globalSettings.height);
	 			game.death++;
	 			game.points -= game.levelBonus;
	 			loadLevel(game.currentLevel);
 			}
 		}
    }
    
    for (var i = 0; i < goals.length; i++){
    	htmlElements.ctx.fillStyle = goals[i].colour;
    	htmlElements.ctx.fillRect(goals[i].x, goals[i].y, goals[i].width, goals[i].height);
    	
    	moveObject(goals[i]);
    	
    	var dir = colCheck(player, goals[i]);
    	
    	if (dir === "l" || dir === "r" || dir === "t" || dir === "b"){
    		if (game.active){
				game.death = 0;
				game.completedLvls.push(game.currentLevel);
				loadMenu("levels");
    		}
    	}
    }
    
    for (var i = 0; i < bonus.length; i++){
    	htmlElements.ctx.fillStyle = bonus[i].colour;
    	htmlElements.ctx.fillRect(bonus[i].x, bonus[i].y, bonus[i].width, bonus[i].height);
    	
    	moveObject(bonus[i]);
    	
    	var dir = colCheck(player, bonus[i]);
    	
    	if (dir === "l" || dir === "r" || dir === "t" || dir === "b"){
    		bonus[i].x = 2000;
    		bonus[i].y = 2000;
    		game.points += bonus[i].value;
			game.levelBonus += bonus[i].value;
			
			game.resetBonus = false;
			gravityBonus();
    	}
    }
    
    //////////////////////////////////////////////// player movement /////////////////////////////////////////////////////
 
    if(player.grounded){
         player.velY = 0;
    }
    
    setTail();
    
    player.x += player.velX;
	player.y += player.velY;	
 
    htmlElements.ctx.fillStyle = player.colour;
    htmlElements.ctx.fillRect(player.x, player.y, player.width, player.height);
    
    drawTail();
    
///////////////////////////////////////////////////// Draw game text //////////////////////////////////////////////////////
	htmlElements.ctx.font = scale(20)+"px Arial";
	htmlElements.ctx.fillStyle = "#fff";
	htmlElements.ctx.textAlign = "start";
	//htmlElements.ctx.fillText("Points: "+game.points, scale(10), scale(30));
	htmlElements.ctx.fillText("Bounces: "+game.bounces, scale(10), scale(55));
	htmlElements.ctx.fillText("Deaths: "+game.death, scale(10), scale(80));

///////////////////////////////////////////////////// Draw Bonus Timer ////////////////////////////////////////////////////
	if (game.bonusTimer > 0){
		htmlElements.ctx.font = scale(20)+"px Arial";
		htmlElements.ctx.fillStyle = "#fff";
		htmlElements.ctx.textAlign = "start";
		htmlElements.ctx.fillText(game.bonusTimer, (player.x), (player.y - 10));
	}
///////////////////////////////////////////////////// Update Game /////////////////////////////////////////////////////////
	if (game.active){
		requestAnimationFrame(updateGame);
	}
}

function clearCanvas(){
	htmlElements.ctx.clearRect(0, 0, globalSettings.width, globalSettings.height);
    //draw background colour
    htmlElements.ctx.fillStyle = "#000";
	htmlElements.ctx.fillRect(0, 0, globalSettings.width, globalSettings.height);
}

function moveObject(Ob){
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

function jump(){
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

function setTail(){
	
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

function drawTail(){
	htmlElements.ctx.fillStyle = "rgba(236,208,120,0.2)";
    htmlElements.ctx.fillRect(player.prevX1 + ((player.width-(player.width*0.9))/2), player.prevY1 + ((player.height-(player.height*0.9))/2), player.width*0.9, player.height*0.9);
    htmlElements.ctx.fillRect(player.prevX2 + ((player.width-(player.width*0.8))/2), player.prevY2 + ((player.height-(player.height*0.8))/2), player.width*0.8, player.height*0.8);
    htmlElements.ctx.fillRect(player.prevX3 + ((player.width-(player.width*0.7))/2), player.prevY3 + ((player.height-(player.height*0.7))/2), player.width*0.7, player.height*0.7);
    htmlElements.ctx.fillRect(player.prevX4 + ((player.width-(player.width*0.6))/2), player.prevY4 + ((player.height-(player.height*0.6))/2), player.width*0.6, player.height*0.6);
	htmlElements.ctx.fillRect(player.prevX5 + ((player.width-(player.width*0.5))/2), player.prevY5 + ((player.height-(player.height*0.5))/2), player.width*0.5, player.height*0.5);
	htmlElements.ctx.fillRect(player.prevX6 + ((player.width-(player.width*0.4))/2), player.prevY6 + ((player.height-(player.height*0.4))/2), player.width*0.4, player.height*0.4);
}

function gravityBonus(timer){
	timer = (typeof timer !== 'undefined') ?  timer : 5;
	if (!game.resetBonus){
		game.bonusTimer = timer;
		if (timer > 0){
			game.gravity = scale(game.defaultGravity/4);
			window.setTimeout(function(){
				gravityBonus(timer-1);
			}, 1000);
		} else {
			resetBonus();
		}
	}
}

function resetBonus(){
	game.bonusTimer = 0;
	game.gravity = scale(game.defaultGravity);
	game.resetBonus = true;
}

function loadMenu(menuType){
	menu.active = true;
	game.active = false;
	globalSettings.state = "menu";
	toggleTouchInputs(false);
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

function startGame(){
	menu.active = false;
	globalSettings.state = "game";
	toggleTouchInputs(true);
	loadLevel(game.currentLevel);
}

function toggleTouchInputs(show){
	htmlElements.leftTouchContainer.style.display = htmlElements.rightTouchContainer.style.display = (show) ? "block" : "none";
}

function loadLevel(lvl){
	console.log("Loading level: "+lvl);
	lvl = (lvl < 10) ? "0"+lvl : lvl;
	game.levelBonus = 0;
	game.bounces = 0;
	resetBonus();
	var cache = new Date().getTime();
	var boxReq = new XMLHttpRequest();
	var url = "levels/level"+lvl+"/box.txt?cache="+cache;
	boxReq.onreadystatechange = function() {
		if (boxReq.readyState == 4 && boxReq.status == 200) {
			boxes = JSON.parse(boxReq.responseText);
			scaleObjects(boxes);
			var goalReq = new XMLHttpRequest();
			url = "levels/level"+lvl+"/goal.txt?cache="+cache;
			goalReq.onreadystatechange = function() {
				if (goalReq.readyState == 4 && goalReq.status == 200) {
					goals = JSON.parse(goalReq.responseText);
					scaleObjects(goals);
					var hazardReq = new XMLHttpRequest();
					url = "levels/level"+lvl+"/hazard.txt?cache="+cache;
					hazardReq.onreadystatechange = function() {
						if (hazardReq.readyState == 4 && hazardReq.status == 200) {
							hazards = JSON.parse(hazardReq.responseText);
							scaleObjects(hazards);
							var playerReq = new XMLHttpRequest();
							url = "levels/level"+lvl+"/player.txt?cache="+cache;
							playerReq.onreadystatechange = function() {
								if (playerReq.readyState == 4 && playerReq.status == 200) {
									player = JSON.parse(playerReq.responseText);
									scalePlayer(player);
									var bonusReq = new XMLHttpRequest();
									url = "levels/level"+lvl+"/bonus.txt?cache="+cache;
									bonusReq.onreadystatechange = function() {
										if (bonusReq.readyState == 4 && bonusReq.status == 200) {
											bonus = JSON.parse(bonusReq.responseText);
											scaleObjects(bonus);
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

function resetGame(){
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
		var mousePos = getMousePos(htmlElements.canvas, e);
		
		switch(menu.currentType){
			case "main":
				for (var i = 0; i < menu.mainItems.length; i++) {
					var xPos = (menu.mainItems[i].textAlign === "start") ? menu.mainItems[i].x : (menu.mainItems[i].x - (menu.mainItems[i].width/2));
					var rect = {
						x:		scale(xPos),
						y:		scale(menu.mainItems[i].y - menu.mainItems[i].height),
						width:	scale(menu.mainItems[i].width),
						height:	scale(menu.mainItems[i].height)
					};
					if (isInside(mousePos,rect)) {
						switch (menu.mainItems[i].nav){
							case "start":
								game.currentLevel = 1;
								startGame();
								break;
							case "levelsMenu":
								loadMenu("levels");
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
								x:		scale(xPos),
								y:		scale(menu.lvlPositions[j-1][1] - menu.levelItems[i].height),
								width:	scale(menu.levelItems[i].width),
								height:	scale(menu.levelItems[i].height)
							};
							console.dir(rect);
							if (isInside(mousePos,rect)) {
								game.currentLevel = j;
								startGame();
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
htmlElements.leftTouchContainer.addEventListener("touchstart", function(e){
	keys[37] = true;
});
htmlElements.leftTouchContainer.addEventListener("touchend", function(e){
	keys[37] = false;
});
htmlElements.rightTouchContainer.addEventListener("touchstart", function(e){
	keys[39] = true;
});
htmlElements.rightTouchContainer.addEventListener("touchend", function(e){
	keys[39] = false;
});
window.addEventListener("resize", function(e){
	scaleCanvas();
	if(game.active){
		startGame();
	}
}); 
window.addEventListener("load", function () {
	scaleCanvas();
	loadMenu("main");
});
htmlElements.canvas.addEventListener("click", function(e){
	canvasTouch(e);
}, false);
htmlElements.canvas.addEventListener("touchend", function(e){
	canvasTouch(e);
}, false);
