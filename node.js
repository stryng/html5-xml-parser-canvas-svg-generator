####################################################################
# Project: Html5
# File Title : README
# Author : tHeStRyNg - stryng@gmail.com
# Date : 28-02-2012
# Version : 0.001
# Description: An attempt of creating a xml js html5 parser for svg
####################################################################


//I've replaced with function displayTree(width, height) { ; I don't want to get xmlFile after the new node has been added
function displayTree(xmlFile, width, height){
//Local variables
var zoomLevel = 1.0;

if (width != undefined)
    setCanvasWidth(width);
if (height != undefined)
    setCanvasHeight(height);
//I don't want to prase the xml string from the server
    //parseXML(xmlFile);
if(xmlDoc == null)
    return;
root = xmlDoc.documentElement;

//Build the object tree
createObjects(root, 0);

//Set root node visible
root.visible = true;
root.x = getCanvasWidth()/4;
root.y = getCanvasHeight()/2;

canvas = document.getElementById("canvas");
p = Processing(canvas);

//Processing init function
p.setup = function(){
    p.size(getCanvasWidth(), getCanvasHeight());
    p.colorMode(p.RGB, 256);
    p.background(getCanvasColor());
    p.stroke(0, 0, 0);
    p.rectMode(p.CENTER);
    p.smooth();
    //p.textSize(14);

    var myFont = p.loadFont(getNodeFontType(), 10);
    p.textFont(myFont);
    p.textAlign(p.CENTER);      
};

//Main draw loop
p.draw = function(){
    p.background(getCanvasColor());
    display(root);
    setCursor(0);
    if (isDanceEnabled())
        dance(0);
    if (isExpanded()) {
        setIsExpanded(false);
        expandAll();
    }   
}


//Recursively called to display appropriate nodes and link them with lines
//Also handles mouseover color change and dragging color change
function display(node){
    if(node.visible){
        if (hasBorder() == true)
            p.stroke(getBorderColor());
        else
            p.noStroke();

        if(beingDragged != null && node == beingDragged){
            p.fill(getActiveColor());
        } else if(p.mouseX >= node.x-node.width/2 && p.mouseX <= node.x+node.width/2 
            && p.mouseY >= node.y-node.height/2 && p.mouseY <= node.y+node.height/2){
            if (currentClickedNode == node)
                p.fill(getSelectedColor());
            else
                p.fill(getHoverColor());

            document.getElementById('show_label').innerHTML = node.label;
            document.getElementById('show_url').innerHTML = node.url;
            document.getElementById('show_url').href = node.url;
        } else if (currentClickedNode == node){
            p.fill(getSelectedColor());                     
        } else {
            p.fill(getNodeColor());
        }           
        p.rect(node.x, node.y, node.width, node.height);

        //Handle node expander graphic
        if (node.children.length != 0) {
            p.noStroke();
            p.fill(getActiveColor());
            p.rect(node.x+node.width/2, node.y, 3, 3);
        }   

        //Handle text           
        p.fill(getFontColor());
        // calculate text size based on the current size of the node
        p.textSize(getTextSize(node));
        p.text(node.label, node.x - node.width/2 + 5, node.y + 5);
        //p.text(node.label, node.x-35, node.y+5);

        //Used for drag/drop
        var x_origin = node.x + node.width/2;
        var y_origin = node.y;

        //Recurse on children and draw connecting lines
        for(var i=0; i<node.children.length; i++){
            if(node.children[i].visible && node.children[i].x - node.children[i].width/2 > 0 && node.children[i].y > 0){
                display(node.children[i]);
                p.stroke(getLineColor());
                p.line(x_origin, y_origin, node.children[i].x - node.children[i].width/2, node.children[i].y);
            }
        }
    }
}

//Mousedown callback
p.mousePressed = function() {
    if(p.mouseButton == p.LEFT){
        clickedNode = null;

        //Determine which node is clicked on
        for(var i=0; i<allNodes.length; i++){
            if(p.mouseX >= allNodes[i].x-allNodes[i].width/2 && p.mouseX <= allNodes[i].x+allNodes[i].width/2 
                && p.mouseY >= allNodes[i].y-allNodes[i].height/2 && p.mouseY <= allNodes[i].y+allNodes[i].height/2){
                clickedNode = allNodes[i];
                break;
            }
        }

        //Set state vars for drag and drop of a node
        if(clickedNode != null){
            clickedNode.moved = true;
            beingDragged = clickedNode;
            currentClickedNode = clickedNode;
            difx = p.mouseX - clickedNode.x;
            dify = p.mouseY - clickedNode.y;

        } else {
        //Set state vars for drag and drop of the whole tree (clicked on empty space)
            for(var i=0; i<allNodes.length; i++){
                allNodes[i].oldx = allNodes[i].x;
                allNodes[i].oldy = allNodes[i].y;
            }
            difx = p.mouseX;
            dify = p.mouseY;

            setCursor(4);
        }

        return;
    } else if(p.mouseButton == p.RIGHT){
        //Handle right-clicking for links

        clickedNode = null;

        //Determine which node is clicked on
        for(var i=0; i<allNodes.length; i++){
            if(p.mouseX >= allNodes[i].x-allNodes[i].width/2 && p.mouseX <= allNodes[i].x+allNodes[i].width/2 
                && p.mouseY >= allNodes[i].y-allNodes[i].height/2 && p.mouseY <= allNodes[i].y+allNodes[i].height/2){
                clickedNode = allNodes[i];
                break;
            }
        }

        //Set state vars for drag and drop of a node
        if(clickedNode != null){
            clickedNode.moved = true;
            beingDragged = clickedNode;
            difx = p.mouseX - clickedNode.x;
            dify = p.mouseY - clickedNode.y;
        } else {
        //Set state vars for drag and drop of the whole tree (clicked on empty space)
            for(var i=0; i<allNodes.length; i++){
                allNodes[i].oldx = allNodes[i].x;
                allNodes[i].oldy = allNodes[i].y;
                allNodes[i].oldwidth = allNodes[i].width;
                allNodes[i].oldheight = allNodes[i].height;
            }
            difx = p.mouseX;
            dify = p.mouseY;
            setCursor(6);
        }
        return;     
    }

}

// Handle dragging
p.mouseDragged = function(){
    if(p.mouseButton == p.LEFT){
        mouseMoved = true;
        if(clickedNode != null){    //dragging on the node - move the node
            clickedNode.x = p.mouseX-difx; 
            clickedNode.y = p.mouseY-dify;
        } else {                    //dragging on the empty space - panning
            for(var i=0; i<allNodes.length; i++){
                allNodes[i].x = allNodes[i].oldx + p.mouseX - difx;
                allNodes[i].y = allNodes[i].oldy + p.mouseY - dify;
            }
        }
    } else if(p.mouseButton == p.RIGHT){
        mouseMoved = true;
        if(clickedNode != null){
            clickedNode.x = p.mouseX-difx; 
            clickedNode.y = p.mouseY-dify;
        } else {    // Zoom             
            // zooming only refers to the difference in y-axis              
            zoomLevel = 1.0 + (p.mouseY - dify) / 500.0;
            zoom(zoomLevel);
        }
    }
}


p.mouseReleased = function(){
    // If mouse has not moved since mousedown, expand/collapse tree
    if(!mouseMoved){
        if (p.mouseButton == p.LEFT){
            clickedNode = null;
            // Determine which node is clicked on
            for(var i=0; i<allNodes.length; i++){
                if(p.mouseX >= allNodes[i].x-allNodes[i].width/2 && p.mouseX <= allNodes[i].x+allNodes[i].width/2 
                    && p.mouseY >= allNodes[i].y-allNodes[i].height/2 && p.mouseY <= allNodes[i].y+allNodes[i].height/2){
                    clickedNode = allNodes[i];
                    break;
                }
            }           
            if(clickedNode == null){
                enableDance();
                return;
            }

            //Expand or collapse
            if(clickedNode.expanded){
                clickedNode.expanded = false;
                collapseNode(clickedNode);
            } else {
                clickedNode.expanded = true;
                expandNode(clickedNode);
            }

            calculateChildrenPosition(clickedNode);

            document.getElementById('edit_label').value = clickedNode.label;
            document.getElementById('edit_url').value = clickedNode.url;                
            document.getElementById('edit_label').removeAttribute("disabled");
            document.getElementById('edit_url').removeAttribute("disabled");
        } else if (p.mouseButton == p.RIGHT){   
            if (clickedNode != null){
                document.getElementById('edit_label').value = clickedNode.label;
                document.getElementById('edit_url').value = clickedNode.url;                    
                document.getElementById('edit_label').removeAttribute("disabled");
                document.getElementById('edit_url').removeAttribute("disabled");
                //saveImage("file://localhost/E:/Documents%20and%20Settings/My%20Documents/Aptana%20Studio/InteractiveTreeview/test.png");
                //p.link(clickedNode.url, "_new");  
                openNewWindow(clickedNode.url);                                                     
            } else {    // right click on the empty space
                zoomToFit();
            }
        }   
    } else if (mouseMoved){
        if (p.mouseButton == p.LEFT) {
            clickedNode = null;
            //Determine which node is clicked on
            for (var i = 0; i < allNodes.length; i++) {
                if (p.mouseX >= allNodes[i].x - allNodes[i].width / 2 && p.mouseX <= allNodes[i].x + allNodes[i].width / 2 &&
                p.mouseY >= allNodes[i].y - allNodes[i].height / 2 &&
                p.mouseY <= allNodes[i].y + allNodes[i].height / 2) {
                    clickedNode = allNodes[i];
                    break;
                }
            }
            if (clickedNode == null) {
                // dragging is finished, so back to default cursor
                setCursor(5);
                return;
            }
        } else if (p.mouseButton == p.RIGHT){
            clickedNode = null;
            //Determine which node is clicked on
            for (var i = 0; i < allNodes.length; i++) {
                if (p.mouseX >= allNodes[i].x - allNodes[i].width / 2 && p.mouseX <= allNodes[i].x + allNodes[i].width / 2 &&
                p.mouseY >= allNodes[i].y - allNodes[i].height / 2 &&
                p.mouseY <= allNodes[i].y + allNodes[i].height / 2) {
                    clickedNode = allNodes[i];
                    break;
                }
            }
            if (clickedNode == null) {
                // dragging is finished, so back to default cursor
                setCursor(5);
                return;
            }
        }   

    }

    mouseMoved = false;
    beingDragged = null;
    clickedNode = null;
}

p.init();

}
