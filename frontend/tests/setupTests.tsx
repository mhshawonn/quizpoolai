import "@testing-library/jest-dom";
import "whatwg-fetch";
import { TextDecoder, TextEncoder } from "util";

if (!global.TextEncoder) {
  // @ts-expect-error polyfill for jest
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-expect-error polyfill for jest
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { server } = require("./server");

jest.mock("framer-motion", () => {
  const React = require("react");
  const componentFactory =
    (Tag: keyof JSX.IntrinsicElements) =>
    ({
      children,
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      transition,
      layout,
      ...rest
    }: {
      children: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
      layout?: unknown;
    }) =>
      React.createElement(Tag, rest, children);

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, key: string) => componentFactory(key as keyof JSX.IntrinsicElements)
    }
  );

  return {
    __esModule: true,
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
