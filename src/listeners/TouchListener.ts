import { forAnimationFrame } from 'waitasecond';
import { IEvent } from '../interfaces/IEvent';
import { IListener } from '../interfaces/IListener';
import { Touch } from '../Touch';
import { TouchFrame } from '../TouchFrame';
import { getBoundingClientRectEnhanced } from '../utils/getBoundingClientRectEnhanced';
import { Vector2 } from '../Vector2';
import { IElement } from './../interfaces/IElement';
import { SourceCache } from './../utils/Cache';
import { EventManager } from './../utils/EventManager';

const TOUCH_LISTENER_OPTIONS = {
    capture: true,
    passive: false,
};

export class TouchListener implements IListener {
    public get title() {
        return `TOUCH`;
    }
    public startEventType = `touchstart`;

    private elements = new SourceCache<
        IElement,
        {
            anchorElement: IElement;
            createTouchFrameFromEvent: ICreateTouchFrameFromEvent;
            newTouch: (touch: Touch) => void;
        }
    >();

    constructor(private eventManager: EventManager) {}

    public acceptsEvent(event: Event) {
        return true;
    }

    public init(
        element: IElement,
        anchorElement: IElement,
        newTouch: (touch: Touch) => void,
        newHoverFrame: (frame: TouchFrame) => void,
    ) {
        if (this.elements.hasItem(element)) {
            throw new Error(
                `Element should not be initialized when using init.`,
            );
        }

        this.eventManager.addEventListener(
            element,
            'touchstart',
            (event) => handleTouchesStart(event as any),
            TOUCH_LISTENER_OPTIONS,
        );
        this.eventManager.addEventListener(
            element,
            'touchmove',
            (event) => handleTouchesMove(event as any),
            TOUCH_LISTENER_OPTIONS,
        );
        this.eventManager.addEventListener(
            element,
            'touchend',
            (event) => handleTouchesEnd(event as any),
            TOUCH_LISTENER_OPTIONS,
        );
        this.eventManager.addEventListener(
            element,
            'touchcancel',
            (event) => handleTouchesEnd(event as any),
            TOUCH_LISTENER_OPTIONS,
        );

        const currentTouches: { [identifier: number]: Touch } = {};

        const handleTouchesStart = (event: TouchEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const touches = event.changedTouches;
            for (let i = 0, l = touches.length; i < l; i++) {
                const currentTouch = new Touch(
                    'TOUCH',
                    anchorElement,
                    createTouchFrameFromEvent(touches[i]),
                    touches[i].identifier,
                );
                currentTouches[touches[i].identifier] = currentTouch;
                newTouch(currentTouch);
            }
        };

        const handleTouchesMove = (event: TouchEvent) => {
            event.preventDefault();
            const touches = event.changedTouches;
            for (let i = 0, l = touches.length; i < l; i++) {
                const currentTouch =
                    currentTouches[touches[i].identifier] || null;
                if (currentTouch) {
                    currentTouch.move(
                        createTouchFrameFromEvent(touches[i]),
                        false,
                    );
                }
            }
        };

        const handleTouchesEnd = (event: TouchEvent) => {
            event.preventDefault();
            const touches = event.changedTouches;
            for (let i = 0, l = touches.length; i < l; i++) {
                const currentTouch =
                    currentTouches[touches[i].identifier] || null;
                if (currentTouch) {
                    currentTouch.move(
                        createTouchFrameFromEvent(touches[i]),
                        true,
                    );
                    delete currentTouches[touches[i].identifier];
                }
            }
        };

        const createTouchFrameFromEvent: ICreateTouchFrameFromEvent = (
            event: IEvent,
        ) => {
            const boundingRect = getBoundingClientRectEnhanced(element);
            return new TouchFrame(
                element,
                anchorElement,
                new Vector2(
                    event.clientX - boundingRect.left,
                    event.clientY - boundingRect.top,
                ),
                performance.now(),
            );
        };

        this.elements.setItem(element, {
            anchorElement,
            createTouchFrameFromEvent,
            newTouch,
        });
    }

    public async startFromExternalEvent(
        element: IElement,
        originalEvent: Event,
    ) {
        const item = this.elements.getItem(element);
        if (!item) {
            throw new Error(
                `Element should be initialized when using startFromExternalEvent.`,
            );
        }
        const { anchorElement, createTouchFrameFromEvent, newTouch } = item;

        const identifier = (originalEvent as TouchEvent).touches[0].identifier;

        await forAnimationFrame();

        // TODO: maybe DRY this block with block in createMouseListener
        // TODO: better naming in this block

        const currentTouch = new Touch(
            'TOUCH',
            anchorElement,
            createTouchFrameFromEvent((originalEvent as TouchEvent).touches[0]),
            identifier,
        );

        const getTouchFromEvent = (event: TouchEvent) =>
            Array.from(event.touches).find(
                (touch) => touch.identifier === identifier,
            );

        const handleTouchMoveOnDocument = (event: TouchEvent) => {
            // TODO: problems with zoom whole page

            const touch = getTouchFromEvent(event);
            if (touch) {
                event.preventDefault();
                event.stopPropagation();
                currentTouch.move(createTouchFrameFromEvent(touch), false);
            }
        };
        this.eventManager.addEventListener(
            document,
            'touchmove',
            handleTouchMoveOnDocument,
            TOUCH_LISTENER_OPTIONS,
        );

        const handleTouchUpOnDocument = (event: TouchEvent) => {
            currentTouch.end();

            this.eventManager.removeEventListener(
                document,
                'touchmove',
                handleTouchMoveOnDocument,
            );

            document.removeEventListener('touchend', handleTouchUpOnDocument);
            // }
        };

        this.eventManager.addEventListener(
            document,
            'touchend',
            handleTouchUpOnDocument,
            TOUCH_LISTENER_OPTIONS,
        );

        newTouch(currentTouch);
    }
}

type ICreateTouchFrameFromEvent = (event: IEvent) => TouchFrame;
