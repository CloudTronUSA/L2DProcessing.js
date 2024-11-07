void setup() {
size(400,400);
background(255);
l2d = setupLive2D();
l2d.initialize(0,0,400,400,"http://127.0.0.1:8000/models/Rice/", "Rice.model3.json");

frameRate(60);
}

void draw() {
background(255);
l2d.updateModel();
}


void mouseClicked() {
l2d.startMotion("TapBody",2);
}