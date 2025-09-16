const { validateInput } = require("../src/server");

describe("Server Input Validation Tests", () => {
    describe("validateInput", () => {
        test("should throw TypeError when input is null", () => {
            expect(() => validateInput(null)).toThrow(TypeError);
        });

        test("should throw TypeError when input is undefined", () => {
            expect(() => validateInput(undefined)).toThrow(TypeError);
        });

        test("should not throw when input is valid", () => {
            expect(() => validateInput("valid")).not.toThrow();
        });
    });
});
