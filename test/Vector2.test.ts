import { Vector2 } from '../src/Vector2';

describe('Vector2', () => {
    const point1x1y = new Vector2(1, 1);
    const point1x2y = new Vector2(1, 2);
    const point2x2y = new Vector2(2, 2);

    it('length is working.', () => {
        expect(point1x1y.length()).toBeCloseTo(1.41, 0.1);
        expect(point2x2y.length()).toBeCloseTo(1.41 * 2, 0.1);
        expect(point2x2y.length(point1x1y)).toBeCloseTo(1.41, 0.1);
        expect(point2x2y.length(point1x2y)).toEqual(1);
    });
});
