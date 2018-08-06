define(['./Container', 'Cesium','../3DGIS/flyRoute','drag','slider','../lib/tooltip','../lib/HeadControls','../lib/jeelizFaceFilter'],function(Container, Cesium, flyRoute,drag, slider,tooltip,HeadControls,jeelizFaceFilter){
    "use strict";
    var _ = require('underscore');
    var $ = require('jquery');
    var scene;
    var viewer;
    var camera;
    var handler;
    var flyCirclePoint;

    var htmlStr = `
        <div class="tabs-vertical mainView" id="sceneForm" style="position: absolute;width:330px;z-index: 1;cursor: auto;">
            <label style="text-align: left;margin-bottom: 10px;margin-top: -10px;font-size: 13px;color: lightgrey;">${Resource.sceneOptions}</label>
            <button style="top: 10px;position: absolute;right: 1rem;" aria-label="Close" id="closeScene" class="myModal-close"
                    title="关闭"><span aria-hidden="true">×</span></button>
            <ul>
                <li><a class="tab-active" data-index="0" href="#">${Resource.basicOptions}</a></li>
                <li><a data-index="1" href="#">${Resource.otherOptions}</a></li>
                <li><a data-index="2" href="#">场景颜色</a></li>
                <li style="font-size: 12px"><a data-index="3" href="#">泛光</a></li>
                <li style="font-size: 12px"><a data-index="4" href="#">相机</a></li>
                <li style="font-size: 12px"><a data-index="5" href="#">关于</a></li>
            </ul>
            <div class="tabs-content-placeholder" style="height: 100%;" id="scene-placeholder">
                <section class="tab-content-active">
                    <label>${Resource.sceneName}</label>
                    <input type="text" class="input" disabled id="sceneName">
                    <label>${Resource.viewMode}</label>
                    <select id="sceneMode" class="cesium-button">
                        <option value="3D">3D</option>
                        <option value="2D">2D</option>
                        <option value="columbusView">Columbus View</option>
                    </select>
                    <label>${Resource.multiViewport}</label>
                    <select id="viewportType" class="cesium-button">
                        <option value="NONE" selected>${Resource.onePort}</option>
                        <option value="HORIZONTAL">${Resource.horizontalSnap}</option>
                        <option value="VERTICAL">${Resource.verticalSnap}</option>
                        <option value="TRIPLE">${Resource.tripeSnap}</option>
                        <option value="QUAD">${Resource.quadSnap}</option>
                    </select>
                    <label>卷帘效果</label>
                    <select id="splitType" class="cesium-button">
                        <option value="NONE" selected>禁用卷帘</option>
                        <option value="LEFT">屏蔽卷帘左侧</option>
                        <option value="RIGHT">屏蔽卷帘右侧</option>
                        <option value="TOP">屏蔽卷帘上侧</option>
                        <option value="BOTTOM">屏蔽卷帘下侧</option>
                    </select>
                    <button class="btn btn-info" id="queryCoordinates">查询坐标值</button>
                    <div class="param-item"><span>经度</span><input type="text" class="input" style="width: 80%;margin-left: 0.5rem;" disabled id="scene-coordinate-longitude"/></div>
                    <div class="param-item"><span>纬度</span><input type="text" class="input" style="width: 80%;margin-left: 0.5rem;" disabled id="scene-coordinate-latitude"/></div>
                    <div class="param-item"><span>高度</span><input type="text" class="input" style="width: 80%;margin-left: 0.5rem;" disabled id="scene-coordinate-height"/></div>
                </section>
        
                <section>
                    <div class="square"><input type="checkbox" id="earth" checked/><label for="earth">${Resource.earth}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="shadows"/><label
                            for="shadows">${Resource.shadowMap}</label></div>
                    <div class="square"><input type="checkbox" id="lightRender" checked/><label for="lightRender">${Resource.sun}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="timeline"/><label for="timeline">${Resource.timeline}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="atomsphereRender" checked/><label for="atmosphere">${Resource.skyAtmosphereEffect}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="fogEnabled" checked/><label for="fogEnabled">${Resource.fogEffect}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="depthAgainst" checked/><label for="depthAgainst">${Resource.depthAgainst}</label>
                    </div>
                    <div class="square"><input type="checkbox" id="icon" checked/><label for="icon">Logo</label></div>
                    <div class="square"><input type="checkbox" id="underground"/><label for="underground">地下</label></div>
                </section>
        
                <section>
                    <label>${Resource.brightness}</label>
                    <input type="number" min="0" max="3" step="0.02" value="1.0" id="brightness" class="input">
                    <label>${Resource.contrast}</label>
                    <input type="number" min="0" max="3" step="0.02" value="1.0" id="contrast" class="input">
                    <label>${Resource.hue}</label>
                    <input type="number" min="0" max="3" step="0.02" value="0.0" id="hue" class="input">
                    <label>${Resource.saturation}</label>
                    <input type="number" min="0" max="3" step="0.02" value="1.0" id="saturation" class="input">
                    <label>${Resource.gamma}</label>
                    <input type="number" min="0" max="3" step="0.02" value="1.0" id="gamma" class="input">
                </section>
        
                <section>
                    <label style="width: 60px;float: left; margin-top: -0.5px">场景泛光</label>
                    <input type="checkbox" id="bloom"/>
                    <label>亮度阈值</label>
                    <input type="number" id="threshold" class="input" min="0" max="1" value="0.9" step="0.01">
                    <label>泛光强度</label>
                    <input type="number" id="bloomIntensity" class="input" min="0" max="10" value="2.0" step="0.01">
                </section>
        
                <section>
                    <label>飞行线路</label><br><br>
                    <input style="background-color:#2EC5AD" type="file" id="flyFile" onchange="" accept=".fpf"/><br><br>
                    <button class="start" id="startFly" title="开始" style="background-color: transparent;border:none;"></button>
                    <button class="pause" id="pauseFly" title="暂停" style="background-color: transparent;border:none;"></button>
                    <button class="stop" id="stopFly" title="停止" style="background-color: transparent;border:none;"></button>
                    <br><br>
                    <select id="stopList" style="background-color:#2EC5AD;width: 100%">
                    </select>
                    <label>观察</label><br>
                    <table border="0" align="left">
                        <tr>
                            <td>
                                <button id="spin" class="btn btn-info" style="">绕点旋转</button>
                            </td>
                            <td nowrap="nowrap">
                                <input type="checkbox" id="stopFlyCircle">
                                <label style="margin-left: -5px;">暂停</label>
                            </td>
                            <td nowrap="nowrap">
                                <input type="checkbox" id="circulation" checked=true>
                                <label style="margin-left: -5px;">循环</label>
                            </td>
                            <td nowrap="nowrap">
                                <input type="checkbox" id="interaction">
                                <label style="margin-left: -5px;">交互</label>
                                <canvas id="headControlsCanvas" style="width: 250px;height: 512px;display: none"></canvas>
                                <button id="startHeadControlsButton" style="display: none">启用摄像头</button>
                            </td>
                    </table>
                </section>
        
                <section>
                    <label style=" text-align: center; font-size: 20px">SuperMap iEarth</label>
                    <label style=" text-align: center; font-size: 16px">版本 ： 0.1.2</label><br><br><br><br>
                    <label>更新内容</label><br><br>
                    <textarea id="scenePortalDescription" style="width:220px;height:100px;resize: none;
                    margin-left: 15px;background:transparent">1、加速初始化\n\n2、部分界面调整
                    </textarea>
                </section>
            </div>
        </div>
    `;
    var sceneAttribute = Container.extend({
        tagName: 'div',
        id: 'sceneAttribute',
        events : {
            'click #closeScene'  : 'onCloseSceneClk',
            'change input[type=file]' : 'onInputChange',
            'click #queryCoordinates'  : 'onQueryCoordinatesClk',
            'click #startFly'  : 'onStartFlyClk',
            'click #pauseFly'  : 'onPauseFlyClk',
            'click #stopFly'  : 'onStopFlyClk',
            'click #spin'  : 'onSpinClk',
        },
        template : _.template(htmlStr),
        initialize : function(options){
            viewer = options.sceneModel.viewer;
            scene = viewer.scene;
            viewer.scene.bloomEffect.show = false;
            var layers = scene.layers.layerQueue;
            handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            camera = scene.camera;
            camera.flyCircleLoop = true;
            this.render();
            this.on('componentAdded',function(parent){
                var icon = true;
				$(document).ready(function() {
					var widget = $('#sceneForm');
					var tabs = widget.find('ul a'),
						content = widget.find('.tabs-content-placeholder > section');
					tabs.on('click', function (e) {
						e.preventDefault();
						// Get the data-index attribute, and show the matching content div
						var index = $(this).data('index');
						tabs.removeClass('tab-active');
						content.removeClass('tab-content-active');
						$(this).addClass('tab-active');
						content.eq(index).addClass('tab-content-active');
					});
				});
                $('#sceneForm').myDrag({
                    parent:'body',
                    randomPosition:false,
                    direction:'all',
                    handler:false,
                    dragStart:function(x,y){},
                    dragEnd:function(x,y){},
                    dragMove:function(x,y){}
                });
                var imageryLayers = viewer.imageryLayers;
                $("#atomsphereRender").click(function(evt){
                    scene.skyAtmosphere.show = !scene.skyAtmosphere.show;
                });
                $("#lightRender").click(function(evt){
                    scene.globe.enableLighting = !scene.globe.enableLighting;
                });
                $("#shadows").click(function(evt){
                    if($(this).prop('checked')){
                        for(var layer of layers){
                            layer.shadowType = 2;
                            layer.refresh(); // 加这句是因为 不刷新阴影不会立即显示  属于底层问题，待修改
                        }
                    }else{
                        for(var layer of layers){
                            layer.shadowType = 0;
                        }
                    }
                });
                $("#fogEnabled").click(function(evt){
                    scene.fog.enabled = !scene.fog.enabled ;
                });
                $("#depthAgainst").click(function(evt){
                    scene.globe.depthTestAgainstTerrain = !scene.globe.depthTestAgainstTerrain;
                });
                $("#earth").click(function(evt){
                    scene.globe.show = !scene.globe.show;
                });
                $("#timeline").click(function(){
                    var timeline = viewer.timeline.container.style.visibility;
                    if(timeline == "visible"){
                        viewer.timeline.container.style.visibility = 'hidden';
                    }
                    else{
                        viewer.timeline.container.style.visibility = 'visible';
                    }
                });
                $("#icon").click(function(evt){
                    if(icon){
                        $(".cesium-viewer-bottom").hide();
                        icon = false;
                    }
                    else if(!icon){
                        $(".cesium-viewer-bottom").show();
                        icon = true;
                    }
                });
                $("#bloom").click(function(evt){
                    viewer.scene.bloomEffect.show = !viewer.scene.bloomEffect.show;
                });
                $("#threshold").on("input change",function(){
                    viewer.scene.bloomEffect.threshold = this.value;
                });
                $("#bloomIntensity").on("input change",function(){
                    viewer.scene.bloomEffect.bloomIntensity = this.value;
                });
                $("#underground").click(function(evt){
                    viewer.scene.undergroundMode = !viewer.scene.undergroundMode;
                });
                $('#circulation').on("input change",function(){
                    camera.flyCircleLoop = this.checked;
                });
                $('#stopFlyCircle').on("input change",function(){
                    if(this.checked){
                        camera.stopFlyCircle();
                    }else{
                        camera.flyCircle(flyCirclePoint);
                    }
                });
                $('#interaction').on("input change",function(){
                        var SETTINGS={
                            zoomSensibility: 5.5,
                            panSensibility: 0.00000015
                        };
                        var ISHEADCONTROLSON=false,  ISHEADCONTROLSINITIALIZED=false;
                        $("#startHeadControlsButton").show();
                        if(!this.checked){
                            ISHEADCONTROLSON = true;
                            $("#headControlsCanvas").hide();
                            $("#startHeadControlsButton").hide();
                            toggleHeadControls(!ISHEADCONTROLSON);
                            return;
                        }
                        $("#startHeadControlsButton").on("click",function(){
                            $("#headControlsCanvas").show();
                            $("#startHeadControlsButton").hide();
                            if (ISHEADCONTROLSINITIALIZED){
                                toggleHeadControls(!ISHEADCONTROLSON);
                                return;
                            }
                            ISHEADCONTROLSINITIALIZED=true;
                            HeadControls.init({
                                canvasId: 'headControlsCanvas',
                                callbackMove: callbackMove,
                                callbackReady: function(err){
                                    if (err){
                                        console.log('ERROR in index.html : HEAD CONTROLS NOT READY. err =', err);
                                    } else {
                                        console.log('INFO in index.html : HEAD CONTROLS ARE READY :)');
                                        toggleHeadControls(true);
                                    }
                                },
                                NNCpath: 'js/lib/',
                                animateDelay: 2
                            });
                        })
                    function toggleHeadControls(isOn){
                        HeadControls.toggle(isOn);
                        ISHEADCONTROLSON=isOn;
                    }
                    function callbackMove(mv){
                        var cameraHeight = scene.camera.positionCartographic.height/1000.0
                        if (mv.dZ!==0) {
                            var zoomAmount = mv.dZ * SETTINGS.zoomSensibility * cameraHeight;
                            camera.moveForward(zoomAmount);
                        }
                        if (mv.dRx!==0) {
                            var panAmountX=SETTINGS.panSensibility*mv.dRx* cameraHeight;
                            camera.rotateUp(panAmountX);
                        }
                        if (mv.dRy!==0) {
                            var panAmountY=SETTINGS.panSensibility*mv.dRy* cameraHeight;
                            camera.rotate(Cesium.Cartesian3.UNIT_Z, panAmountY);
                        }
                    }
                });
                var sceneName = viewer.scene.name;
                if(sceneName){
                    $("#sceneName").val(sceneName);
                }
                else{
                    $("#sceneName")[0].value = "未命名";
                }
                $('#sceneMode').change(function(){
                    var value = $(this).val();
                    if(value=="2D"){
                        viewer.scene.mode= Cesium.SceneMode.SCENE2D;
                    }
                    else if(value=="3D"){
                        viewer.scene.mode= Cesium.SceneMode.SCENE3D;
                    }
                    else if(value=="columbusView"){
                        viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;
                    }
                });
                $('#viewportType').change(function(){
                    var value = $(this).val();
                    scene.multiViewportMode = Cesium.MultiViewportMode[value];
                });
                $('#splitType').change(function(){
                    var value = $(this).val();
                    if(!document.getElementById("verticalSlider")){
                        $("#cesiumContainer").append("<div id='verticalSlider' style='display: none;'></div>");
                        $("#cesiumContainer").append("<div id='horizontalSlider' style='display: none;'></div>");
                    }
                    var verticalSlider = document.getElementById('verticalSlider');
                    var horizontalSlider = document.getElementById('horizontalSlider');
                    var width = $('body').width()/2;
                    var height = $('body').height()/2;
                    var layers = viewer.scene.layers._layers._array;
                    var splitDirection;
                    var splitPosition;
                    switch (value){
                        case 'NONE':
                            verticalSlider.style.display = 'none';
                            horizontalSlider.style.display = 'none';
                            splitDirection = Cesium.SplitDirection.NONE;
                            splitPosition = undefined;
                            break;
                        case 'LEFT':
                            verticalSlider.style.display = 'block';
                            horizontalSlider.style.display = 'none';
                            splitDirection = Cesium.SplitDirection.LEFT;
                            splitPosition = width;
                            break;
                        case 'RIGHT':
                            verticalSlider.style.display = 'block';
                            horizontalSlider.style.display = 'none';
                            splitDirection = Cesium.SplitDirection.RIGHT;
                            splitPosition = width;
                            break;
                        case 'TOP':
                            verticalSlider.style.display = 'none';
                            horizontalSlider.style.display = 'block';
                            splitDirection = Cesium.SplitDirection.TOP;
                            splitPosition = height;
                            break;
                        case 'BOTTOM':
                            verticalSlider.style.display = 'none';
                            horizontalSlider.style.display = 'block';
                            splitDirection = Cesium.SplitDirection.BOTTOM;
                            splitPosition = height;
                            break;
                        default:break;
                    }
                    for(var i = 0;i < layers.length;i++){
                        var layer = layers[i];
                        layer.splitDirection = splitDirection;
                        if(splitPosition){
                            layer.splitPosition = splitPosition;
                        }
                    }
                    verticalSlider.addEventListener('mousedown', mouseDown, false);
                    horizontalSlider.addEventListener('mousedown', mouseDown, false);
                    var windowHeight = height * 2;
                    document.addEventListener('mouseup', mouseUp, false);
                    function mouseUp(e) {
                        document.removeEventListener('mousemove', sliderMove, false);
                    }
                    function mouseDown(e) {
                        document.addEventListener('mousemove', sliderMove, false);
                    }
                    function sliderMove(e) {
                        if(e.preventDefault){
                            e.preventDefault();
                        }else{
                            e.returnValue = false;
                        }
                        if(splitDirection === Cesium.SplitDirection.LEFT || splitDirection === Cesium.SplitDirection.RIGHT){
                            verticalSlider.style.left = e.clientX + 'px';
                            splitPosition = e.clientX;
                        }else if(splitDirection === Cesium.SplitDirection.TOP || splitDirection === Cesium.SplitDirection.BOTTOM){
                            let clientY = e.clientY;
                            if(clientY < 0){
                                clientY = 0;
                            }else if(clientY > windowHeight){
                                clientY = windowHeight - $('#horizontalSlider').height();
                            }
                            horizontalSlider.style.top = clientY + 'px';
                            splitPosition = windowHeight - clientY;
                        }
                        for(var i = 0;i < layers.length;i++){
                            var layer = layers[i];
                            layer.splitDirection = splitDirection;
                            layer.splitPosition = splitPosition;
                        }
                    }
                });
                $("")
                var brightness = document.getElementById('brightness');
                brightness.oninput = function(){
                    if (imageryLayers.length > 0) {
                        var layer = imageryLayers.get(0);
                        layer['brightness'] = brightness.value;
                    }
                };
                var saturation = document.getElementById('saturation');
                saturation.oninput = function(){
                    if (imageryLayers.length > 0) {
                        var layer = imageryLayers.get(0);
                        layer['saturation'] = saturation.value;
                    }
                };
                var contrast = document.getElementById('contrast');
                contrast.oninput = function(){
                    if (imageryLayers.length > 0) {
                        var layer = imageryLayers.get(0);
                        layer['contrast'] = contrast.value;
                    }
                };
                var hue = document.getElementById('hue');
                hue.oninput = function(){
                    if (imageryLayers.length > 0) {
                        var layer = imageryLayers.get(0);
                        layer['hue'] = hue.value;
                    }
                };
                var gamma = document.getElementById('gamma');
                gamma.oninput = function(){
                    if (imageryLayers.length > 0) {
                        var layer = imageryLayers.get(0);
                        layer['gamma'] = gamma.value;
                    }
                };
            });
        },
        render : function(){
            this.$el.html(this.template());
            return this;
        },
        onCloseSceneClk : function(evt){
        	if(evt && evt.preventDefault){
        		evt.preventDefault();
            }
        	else{
                window.event.returnValue = false;
            }
            viewer.entities.removeAll();
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.$el.hide();
            return false;
        },
        onQueryCoordinatesClk : function(evt){
            var tooltip = createTooltip(document.body);
            handler.setInputAction(function(movement) {
                tooltip.showAt(movement.endPosition, '点击查询坐标值');
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.setInputAction(function(e){
                var position = scene.pickPosition(e.position);
                var cartographic = Cesium.Cartographic.fromCartesian(position);
                $('#scene-coordinate-longitude').val(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6));
                $('#scene-coordinate-latitude').val(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6));
                $('#scene-coordinate-height').val(cartographic.height.toFixed(3));
                tooltip.setVisible(false);
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            },Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        onStartFlyClk : function(evt){
            flyRoute.initializing(viewer);
        },
        onPauseFlyClk : function(evt){
            flyRoute.pause(viewer);
        },
        onStopFlyClk : function(evt){
            flyRoute.stop(viewer);
        },
        onSpinClk : function(evt){
            var center = new Cesium.Cartesian3(0,0,0);
            var flyCircle = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Point);
            flyCircle.drawEvt.addEventListener(function(result){
                center = result.object.position;
                flyCirclePoint = center;
                camera.flyCircle(center);
            });
            flyCircle.activate();
        }
    });
    return sceneAttribute;
});
