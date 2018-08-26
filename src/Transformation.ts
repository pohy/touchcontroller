import Vector2 from './Vector2';
import { translateToVector,vectorToTranslate } from './tools/svgTools';

export default class Transformation {
    constructor(
        public translate: Vector2 = Vector2.Zero(),
        public rotate: number = 0,
        public scale: number = 1,
    ) {}

    static Neutral(): Transformation {
        return new Transformation();
    }

    static translate(translate: Vector2): Transformation {
        return new Transformation(translate);
    }

    static rotate(rotate: number): Transformation {
        return new Transformation(undefined, rotate);
    }

    static scale(scale: number): Transformation {
        return new Transformation(undefined, undefined, scale);
    }

    clone(): Transformation {
        return new Transformation(this.translate, this.rotate, this.scale);
    }

    cloneDeep(): Transformation {
        return new Transformation(
            this.translate.clone(),
            this.rotate,
            this.scale,
        );
    }

    add(transformation: Transformation): Transformation {
        return new Transformation(
            this.translate.add(transformation.translate),
            (this.rotate + transformation.rotate) % (Math.PI * 2),
            this.scale * transformation.scale,
        );
    }

    subtract(transformation: Transformation): Transformation {
        return new Transformation(
            this.translate.subtract(transformation.translate),
            (this.rotate - transformation.rotate + Math.PI * 2) % (Math.PI * 2),
            this.scale / transformation.scale,
        );
    }

    applyOnElement(element: Element){
        switch(element.tagName){
            case 'g':
                this.applyOnSvgElement(element as SVGGElement);
            break;
            default:
                this.applyOnHtmlElement(element as HTMLElement);
        }
    }

    applyOnHtmlElement(element: HTMLElement){
        element.style.left = (parseFloat(element.style.left||'0px')+this.translate.x)+'px';//todo bounding box as default
        element.style.top = (parseFloat(element.style.top||'0px')+this.translate.y)+'px';
    }

    applyOnSvgElement(element: SVGGElement){
        //console.log(element.getAttribute('transform'));
        element.setAttribute('transform',
        vectorToTranslate(
        translateToVector(element.getAttribute('transform')||undefined).add(this.translate)
        ));

        
    }

    /*nest(transformation: Transformation, center: Vector2 = Vector2.Zero()): Transformation {
        return new Transformation(
            this.translate.add(
                transformation.translate
                    .subtract(center)
                    .scale(this.scale)
                    //.rotate(this.rotate, this.translate.subtract(center).scale(this.scale))
                    //.subtract(center)
            ),
            (this.rotate + transformation.rotate) % (Math.PI * 2),
            this.scale * transformation.scale,
        );
    }*/
}