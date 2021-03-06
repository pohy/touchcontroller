import { forAnimationFrame } from 'waitasecond';
import { particleOptionsAverage } from '../utils/average';
import { Vector2 } from './../Vector2';
import { IParticleOptions, Particle } from './Particle';
import { Scene } from './Scene';

export class DrawController {
    public deadParticlesCount = 0;
    private liveCtx: CanvasRenderingContext2D;
    private deadCtx: CanvasRenderingContext2D;
    private scene: Scene;
    private lastRenderNow: null | number = null;
    private contexts: CanvasRenderingContext2D[] = [];
    private subscribers: Array<() => void> = [];

    // TODO: initial do better
    constructor(quality: Vector2, initialColor: string = '#ffffff') {
        {
            const canvas = document.createElement('canvas');
            canvas.width = quality.x;
            canvas.height = quality.y;
            this.liveCtx = canvas.getContext('2d')!;
        }
        {
            const canvas = document.createElement('canvas');
            canvas.width = quality.x;
            canvas.height = quality.y;
            this.deadCtx = canvas.getContext('2d')!;
            this.deadCtx.fillStyle = initialColor;
            this.deadCtx.fillRect(
                0,
                0,
                this.deadCtx.canvas.width,
                this.deadCtx.canvas.height,
            );
        }

        this.scene = new Scene(this.liveCtx);

        // TODO: maybe with run?
        this.renderLoop();
    }

    public drawPoint(options: IParticleOptions) {
        const particle = new Particle(options, 1); // TODO: particle zIndex
        this.scene.addObject(particle);
    }

    public drawLine(
        options1: IParticleOptions,
        options2: IParticleOptions,
        segmentSize: number,
    ) {
        // console.log('options1',options1);
        // console.log('options2',options2);

        const segmentsCount = Math.ceil(
            options1.current.position.length(options2.current.position) /
                segmentSize,
        );

        for (let i = 0; i < segmentsCount; i++) {
            const weight1 = i / segmentsCount;
            const options = particleOptionsAverage(
                { value: options1, weight: weight1 },
                { value: options2, weight: 1 - weight1 },
            );
            // console.log('options',options);
            this.drawPoint(options);
        }
    }

    public get liveParticlesCount(): number {
        return this.scene.particles.length;
    }

    public addContext(context: CanvasRenderingContext2D) {
        this.contexts.push(context);
    }

    public subscribe(callback: () => void) {
        this.subscribers.push(callback);
    }

    private callSubscribers() {
        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }

    private async renderLoop() {
        while (true) {
            this.render(await forAnimationFrame());
        }
    }

    private render(now: number) {
        // this.liveCtx.fillRect(0, 0, this.liveCtx.canvas.width, this.liveCtx.canvas.height);

        if (this.lastRenderNow) {
            const deadParticles = this.scene.update(
                (now - this.lastRenderNow) / 1000,
            );
            this.deadParticlesCount += deadParticles.length;
            for (const object of deadParticles.sort(Particle.compare)) {
                object.render(this.deadCtx);
            }
        }
        this.lastRenderNow = now;

        this.liveCtx.drawImage(this.deadCtx.canvas, 0, 0);
        this.scene.render();

        for (const ctx of this.contexts) {
            // ctx.fillRect(0, 0, this.liveCtx.canvas.width, this.liveCtx.canvas.height);
            ctx.drawImage(
                this.liveCtx.canvas,
                0,
                0,
                this.liveCtx.canvas.width,
                this.liveCtx.canvas.height,
                0,
                0,
                ctx.canvas.width,
                ctx.canvas.height,
            );
        }

        this.callSubscribers();
    }
}
