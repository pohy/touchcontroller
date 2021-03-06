import { BoundingBox } from '../src/BoundingBox';
import { Vector2 } from '../src/Vector2';

describe('BoundingBox', () => {
    const boundingBox1 = new BoundingBox(
        new Vector2(1, 1),
        new Vector2(2, 2),
        0,
    );

    it('intersects is working.', () => {
        expect(boundingBox1.intersects(new Vector2(1, 1))).toEqual(true);
        expect(boundingBox1.intersects(new Vector2(2, 2))).toEqual(true);
        expect(boundingBox1.intersects(new Vector2(3, 3))).toEqual(false);
    });
});
