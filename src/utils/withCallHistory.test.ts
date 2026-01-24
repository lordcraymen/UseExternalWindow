import { withCallHistory } from "./withCallHistory";

describe('withCallHistory', () => {
    it('should store call history', () => {
        const sum = (a: number, b: number) => a + b;
        const sumWithHistory = withCallHistory(sum);

        expect(sumWithHistory(1, 2)).toBe(3);
        expect(sumWithHistory(3, 4)).toBe(7);

        const history = sumWithHistory.callHistory;
        expect(history).toEqual([[1, 2], [3, 4]]);
    });

    it('should use custom onBeforeStore function', () => {
        const multiply = (a: number, b: number) => a * b;
        const onBeforeStore = (args: [number, number]) => [args[0]]; // Store only the first argument as array
        const multiplyWithHistory = withCallHistory(multiply, undefined, onBeforeStore);

        expect(multiplyWithHistory(2, 3)).toBe(6);

        const history = multiplyWithHistory.callHistory;
        expect(history).toEqual([[2]]);
    });

    it('should use custom history reference', () => {
        const greet = (name: string) => `Hello, ${name}!`;
        const greetWithHistory = withCallHistory(greet,'greetHistory');

        expect(greetWithHistory('Alice')).toBe('Hello, Alice!');
        expect(greetWithHistory('Bob')).toBe('Hello, Bob!');

        const history = greetWithHistory.greetHistory;
        expect(history).toEqual([['Alice'], ['Bob']]);
    });
});