const TC = TouchController;
    const scene = document.getElementById('scene');

    scene.width = document.body.clientWidth;
    scene.height = document.body.clientHeight;

    const ctx = scene.getContext('2d');

    class Rect extends TC.BoundingBox {
        constructor(color, acceptor, center, size, rotation = 0, rectangles = []) {
            super(center,size,rotation);
            this._anchorPairs = [];
            this.hovered = false;
            this.acceptor = acceptor;
            this.color = color;
            this.rectangles = rectangles;
            this.startTransformations();
        }
        
        startTransformations(){
            this.shadowBoundingBox = this.cloneDeep();
            this.acceptors= [];

            //console.log(this);
            for(const rect of this.rectangles){
                this.acceptors.push(
                    ...rect.anchorPoints.acceptors
                )
            }

            //console.log(this.acceptors);

        }

        applyTransformation(transformation){
            this.shadowBoundingBox.applyTransformation(transformation);
            
            const snappedBoundingBox = this.snap(this.shadowBoundingBox);
            this.center = snappedBoundingBox.center;
            this.rotation = snappedBoundingBox.rotation;
            

        }


        snap(originalBoundingBox){//todo bounding box without size

            this._anchorPairs = [];
            //const snappedBoundingBox = originalBoundingBox.clone();
            //snappedBoundingBox.rotation = 0;

            function snapTollerance(originalPosition,snappedPosition,tollerance){
                return originalPosition.length(snappedPosition)>tollerance?originalPosition:snappedPosition;
            }


            const donors = this.anchorPoints.donors;
            const acceptors = this.acceptors;


            //-----------------phase 1

            let targetPair1 = null;

            for(const donor of donors){//todo optimize
                for(const acceptor of acceptors){
                    const distance = donor.length(acceptor);
                    if(distance<50){
                        if(!targetPair1){
                            targetPair1 = {distance,donor,acceptor};
                        }else{

                            if(distance<targetPair1.distance){
                                targetPair1 = {distance,donor,acceptor};//todo DRY
                            }
                        }
                    }
                }
                //const sortedAcceptors = this.acceptors.sort((acceptor1,acceptor2)=>donor.length(acceptor1)>donor.length(acceptor2)?1:-1);
                //const snappedPosition = sortedAcceptors[0];
                //snappedBoundingBox.center = snapTollerance(originalBoundingBox.center,snappedPosition,50);
            }


            if(!targetPair1){
                return originalBoundingBox;
            }else{

                this._anchorPairs.push(targetPair1);

                //console.log(targetPair1);
                const translation = targetPair1.acceptor.subtract(targetPair1.donor);

                const snappedBoundingBox = originalBoundingBox.cloneDeep();
                snappedBoundingBox.applyTransformation(
                    TC.Transformation.translate(translation)
                )

                //this.renderAnchor(targetPair1.donor,'DONOR','1');
                //this.renderAnchor(targetPair1.acceptor,'ACCEPTOR','1');

                //-----------------phase 2
                //const acceptorDistances = [];

                const otherDonors = donors
                .filter((donor)=>donor!==targetPair1.donor)
                .map((donor)=>({
                    distance: donor.length(targetPair1.donor),
                    //rotation: donor.rotation(targetPair1.donor),
                    original: donor 
                }));

                const otherAcceptors = acceptors
                .filter((acceptor)=>acceptor!==targetPair1.acceptor)
                .map((acceptor)=>({
                    distance: acceptor.length(targetPair1.acceptor),
                    //rotation: acceptor.rotation(targetPair1.acceptor),
                    original: acceptor
                }));


                let targetPair2 = null;

                for(const otherDonor of otherDonors){
                    for(const otherAcceptor of otherAcceptors){

                        if(
                            Math.abs(otherDonor.distance - otherAcceptor.distance)<5 //&&
                            //Math.abs(otherDonor.rotation - otherAcceptor.rotation)%(Math.PI*2)<Math.PI*2/100 
                        ){
                            const distance = otherDonor.original.length(otherAcceptor.original);
                            if(distance<100){
                                if(!targetPair2){
                                 targetPair2 = {distance,donor:otherDonor.original,acceptor:otherAcceptor.original};
                                }else{
                                    if(distance<targetPair2.distance){
                                        targetPair2 = {distance,donor:otherDonor.original,acceptor:otherAcceptor.original};//todo DRY
                                    }
                                }
                            }
                        }
                    
                    }
                }

                if(!targetPair2){
                    return snappedBoundingBox;
                }else{

                    this._anchorPairs.push(targetPair2);
                    //console.log(targetPair2);

                    


                    snappedBoundingBox.rotate(

                        //targetPair2.donor.rotation(targetPair1.acceptor)
                        targetPair2.acceptor.rotation(targetPair1.acceptor)-targetPair2.donor.add(translation).rotation(targetPair1.acceptor)

                        //targetPair2.acceptor.subtract(targetPair1.acceptor).rotation(targetPair2.donor.subtract(targetPair1.acceptor))
                        ,targetPair1.acceptor
                    );
                    /*snappedBoundingBox.applyTransformation(
                        TC.Transformation.translate(new TC.Vector2(10,0))
                        //TC.Transformation.rotate(0.5)
                    );*/

                    return snappedBoundingBox;

                }

                //-----------------

            }


        }

        render(ctx) {
            this.renderBoundingBox(this,this.color,this.hovered);
            this.renderBoundingBox(this.shadowBoundingBox,'rgba(0,0,0,0.2)',false);
            this._anchorPairs.forEach((anchorPair,index)=>{
                this.renderAnchor(anchorPair.donor,'DONOR',index.toString());
                this.renderAnchor(anchorPair.acceptor,'ACCEPTOR',index.toString());
            })
            this._afterRender = [];
        }

        renderBoundingBox(boundingBox,color,hovered){
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();

            ctx.rotate(boundingBox.rotation);
            ctx.translate(
                ...new TC.Vector2(
                        boundingBox.center.x,
                        boundingBox.center.y
                    )
                    .rotate(-boundingBox.rotation)
                .subtract(
                    new TC.Vector2(
                        boundingBox.size.x/2,
                        boundingBox.size.y/2
                    )
                )
                .toArray()
            );
            
            ctx.rect( 0,0, boundingBox.size.x,boundingBox.size.y);
            ctx.fill();

            /*{
                ctx.fillStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.rect( -5,-5, 10,10);
                ctx.fill();
                ctx.stroke();
            }*/


            if(hovered){
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
        }

        renderAnchors(ctx) {
            ctx.lineWidth = 1;
            {
                const size = 15;
                for(const point of this.anchorPointsVisible.acceptors){//todo optimize
                    this.renderAnchor(point,'ACCEPTOR');
                }
            }
            {
                const size = 10;
                for(const point of this.anchorPointsVisible.donors){//todo optimize
                    this.renderAnchor(point,'DONOR');
                }
            }
        }

        renderAnchor(point,type,label=''){
            let size = 0;
            if(type==='DONOR'){
                size=10;
            }else
            if(type==='ACCEPTOR'){
                size=15;
            }
            ctx.rect( point.x-size/2,point.y-size/2, size,size);
            ctx.stroke();
            if(label){
                ctx.font = "20px Arial";
                ctx.fillText(label,point.x-5,point.y+25); 
            }
        }

        get anchorPoints(){
            return this._anchorPoints();
        }

        get anchorPointsVisible(){
            return this._anchorPoints(this);
        }

        _anchorPoints(from = this.shadowBoundingBox){

            const points = [
                from.center,
                from.center.add(from.size.scale(0.5).rotate(from.rotation + Math.PI / 2 * 0)),
                from.center.add(from.size.scale(0.5).rotate(from.rotation + Math.PI / 2 * 1)),
                from.center.add(from.size.scale(0.5).rotate(from.rotation + Math.PI / 2 * 2)),
                from.center.add(from.size.scale(0.5).rotate(from.rotation + Math.PI / 2 * 3)),

                
                //todo this.center.add(this.size.scale(-.5,0.5).rotate(this.rotation)),

            ];

            let acceptors = [];
            let donors = [];

            if(this.acceptor){
                acceptors = points;
             }else{
                donors = points;
            }
            
            return({
                acceptors,
                donors
            });

        }
    }

    const rects = [];
    rects.push(
        new Rect(
            'aqua',
            false,
            new TC.Vector2(100, 100),
            new TC.Vector2(100, 100),
            Math.PI / 10 * 0,
            rects
        )
    );
    rects.push(
        new Rect(
            'aqua',
            false,
            new TC.Vector2(130, 130),
            new TC.Vector2(100, 100),
            Math.PI / 10 * 1,
            rects
        )
    );
    rects.push(
        new Rect(
            'aqua',
            false,
            new TC.Vector2(200, 200),
            new TC.Vector2(100, 100),
            Math.PI / 10 * 2,
            rects
        )
    );
    rects.push(
        new Rect(
            'aqua',
            false,
            new TC.Vector2(300, 300),
            new TC.Vector2(100, 100),
            Math.PI / 10 * 4,
            rects
        )
    );
    rects.push(
        new Rect(
            'green',
            true,
            new TC.Vector2(500, 300),
            new TC.Vector2(200, 200),
            0,
            rects
        )
    );
    rects.push(
        new Rect(
            'green',
            true,
            new TC.Vector2(720, 300),
            new TC.Vector2(200, 200),
            0,
            rects
        )
    );

    function render() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (const rect of rects.slice().reverse()) {
            rect.render(ctx);
        }
        for (const rect of rects) {
            rect.renderAnchors(ctx);
        }
        requestAnimationFrame(render);
        //setTimeout(render,1000);
    }
    render();


    const touchController = new TC.TouchController(scene);
    const multiTouchController = new TC.MultiTouchController(
        touchController,
        (position)=>rects.find((rect) => rect.intersects(position))
    );



    //console.log(multiTouchController);
    multiTouchController.hoveredElementsChanges.subscribe(([elementNew,elementOld])=>{
        //console.log([elementNew,elementOld]);
        if(elementNew||false){
            elementNew.hovered = true;
        }
        if(elementOld||false){
            elementOld.hovered = false;
        }
    });


    multiTouchController.multiTouches.subscribe(function (multitouch) {

        if(typeof multitouch.element === 'undefined')return;
        const rect = multitouch.element;
        const sizeRatio = rect.size.y / rect.size.x;

        rect.startTransformations();

        multitouch.transformations(
            /*new TC.Transformation(
                rect.center,
                rect.rotation,
                rect.size.x
            )*/
            rect
        ).subscribe(function (transformation) {

                //console.log(transformation);

                /*multitouch.element.center = transformation.translate;
                multitouch.element.rotation = transformation.rotate;
                multitouch.element.size.x = transformation.scale;
                multitouch.element.size.y = transformation.scale * sizeRatio;*/

                //multitouch.element.position = multitouch.element.position.add(transformation.translate);


            },
            function () {
            },
            function () {

                //todo not nessesery
                rect.startTransformations();

                if(multitouch.empty){
                    //alert(`You have selected ${multitouch.element.color} rectangle.`);
                    rect.rotation += (Math.PI*2)/36;
        
                }
            });
    });