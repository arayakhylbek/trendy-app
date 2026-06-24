"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/error.js
var require_error = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/error.js"(exports2, module2) {
    var ApiError = class extends Error {
      /**
       * Creates a representation of an API error.
       *
       * @param {string} message - Error message
       * @param {Request} request - HTTP request
       * @param {Response} response - HTTP response
       * @returns {ApiError} - An instance of ApiError
       */
      constructor(message, request, response) {
        super(message);
        this.name = "ApiError";
        this.request = request;
        this.response = response;
      }
    };
    module2.exports = ApiError;
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/identifier.js
var require_identifier = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/identifier.js"(exports2, module2) {
    var ModelVersionIdentifier = class _ModelVersionIdentifier {
      /*
       * @param {string} Required. The model owner.
       * @param {string} Required. The model name.
       * @param {string} The model version.
       */
      constructor(owner, name, version = null) {
        this.owner = owner;
        this.name = name;
        this.version = version;
      }
      /*
       * Parse a reference to a model version
       *
       * @param {string}
       * @returns {ModelVersionIdentifier}
       * @throws {Error} If the reference is invalid.
       */
      static parse(ref) {
        const match = ref.match(
          /^(?<owner>[^/]+)\/(?<name>[^/:]+)(:(?<version>.+))?$/
        );
        if (!match) {
          throw new Error(
            `Invalid reference to model version: ${ref}. Expected format: owner/name or owner/name:version`
          );
        }
        const { owner, name, version } = match.groups;
        return new _ModelVersionIdentifier(owner, name, version);
      }
    };
    module2.exports = ModelVersionIdentifier;
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/files.js
var require_files = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/files.js"(exports2, module2) {
    async function createFile(file, metadata = {}, { signal } = {}) {
      const form = new FormData();
      let filename;
      let blob;
      if (file instanceof Blob) {
        filename = file.name || `blob_${Date.now()}`;
        blob = file;
      } else if (Buffer.isBuffer(file)) {
        filename = `buffer_${Date.now()}`;
        const bytes = new Uint8Array(file);
        blob = new Blob([bytes], {
          type: "application/octet-stream",
          name: filename
        });
      } else {
        throw new Error("Invalid file argument, must be a Blob, File or Buffer");
      }
      form.append("content", blob, filename);
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      const response = await this.request("/files", {
        method: "POST",
        data: form,
        headers: {
          "Content-Type": "multipart/form-data"
        },
        signal
      });
      return response.json();
    }
    async function listFiles({ signal } = {}) {
      const response = await this.request("/files", {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function getFile(file_id, { signal } = {}) {
      const response = await this.request(`/files/${file_id}`, {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function deleteFile(file_id, { signal } = {}) {
      const response = await this.request(`/files/${file_id}`, {
        method: "DELETE",
        signal
      });
      return response.status === 204;
    }
    module2.exports = {
      create: createFile,
      list: listFiles,
      get: getFile,
      delete: deleteFile
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/util.js
var require_util = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/util.js"(exports2, module2) {
    var ApiError = require_error();
    var { create: createFile } = require_files();
    async function validateWebhook(requestData, secretOrCrypto, customCrypto) {
      let id;
      let body;
      let timestamp;
      let signature;
      let secret;
      let crypto = globalThis.crypto;
      if (requestData && requestData.headers && requestData.body) {
        if (typeof requestData.headers.get === "function") {
          id = requestData.headers.get("webhook-id");
          timestamp = requestData.headers.get("webhook-timestamp");
          signature = requestData.headers.get("webhook-signature");
        } else {
          id = requestData.headers["webhook-id"];
          timestamp = requestData.headers["webhook-timestamp"];
          signature = requestData.headers["webhook-signature"];
        }
        body = requestData.body;
        if (typeof secretOrCrypto !== "string") {
          throw new Error(
            "Unexpected value for secret passed to validateWebhook, expected a string"
          );
        }
        secret = secretOrCrypto;
        if (customCrypto) {
          crypto = customCrypto;
        }
      } else {
        id = requestData.id;
        body = requestData.body;
        timestamp = requestData.timestamp;
        signature = requestData.signature;
        secret = requestData.secret;
        if (secretOrCrypto) {
          crypto = secretOrCrypto;
        }
      }
      if (body instanceof ReadableStream || body.readable) {
        try {
          body = await new Response(body).text();
        } catch (err) {
          throw new Error(`Error reading body: ${err.message}`);
        }
      } else if (isTypedArray(body)) {
        body = await new Blob([body]).text();
      } else if (typeof body === "object") {
        body = JSON.stringify(body);
      } else if (typeof body !== "string") {
        throw new Error("Invalid body type");
      }
      if (!id || !timestamp || !signature) {
        throw new Error("Missing required webhook headers");
      }
      if (!body) {
        throw new Error("Missing required body");
      }
      if (!secret) {
        throw new Error("Missing required secret");
      }
      if (!crypto) {
        throw new Error(
          'Missing `crypto` implementation. If using Node 18 pass in require("node:crypto").webcrypto'
        );
      }
      const signedContent = `${id}.${timestamp}.${body}`;
      const computedSignature = await createHMACSHA256(
        secret.split("_").pop(),
        signedContent,
        crypto
      );
      const expectedSignatures = signature.split(" ").map((sig) => sig.split(",")[1]);
      return expectedSignatures.some(
        (expectedSignature) => expectedSignature === computedSignature
      );
    }
    async function createHMACSHA256(secret, data, crypto) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        base64ToBytes(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      return bytesToBase64(signature);
    }
    function base64ToBytes(base64) {
      return Uint8Array.from(atob(base64), (m) => m.codePointAt(0));
    }
    function bytesToBase64(bytes) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
    }
    async function withAutomaticRetries(request, options = {}) {
      const shouldRetry = options.shouldRetry || (() => false);
      const maxRetries = options.maxRetries || 5;
      const interval = options.interval || 500;
      const jitter = options.jitter || 100;
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let attempts = 0;
      do {
        let delay = interval * 2 ** attempts + Math.random() * jitter;
        try {
          const response = await request();
          if (response.ok || !shouldRetry(response)) {
            return response;
          }
        } catch (error) {
          if (error instanceof ApiError) {
            const retryAfter = error.response.headers.get("Retry-After");
            if (retryAfter) {
              if (!Number.isInteger(retryAfter)) {
                const date = new Date(retryAfter);
                if (!Number.isNaN(date.getTime())) {
                  delay = date.getTime() - (/* @__PURE__ */ new Date()).getTime();
                }
              } else {
                delay = retryAfter * 1e3;
              }
            }
          }
        }
        if (Number.isInteger(maxRetries) && maxRetries > 0) {
          if (Number.isInteger(delay) && delay > 0) {
            await sleep(interval * 2 ** (options.maxRetries - maxRetries));
          }
          attempts += 1;
        }
      } while (attempts < maxRetries);
      return request();
    }
    async function transformFileInputs(client, inputs, strategy) {
      switch (strategy) {
        case "data-uri":
          return await transformFileInputsToBase64EncodedDataURIs(client, inputs);
        case "upload":
          return await transformFileInputsToReplicateFileURLs(client, inputs);
        case "default":
          try {
            return await transformFileInputsToReplicateFileURLs(client, inputs);
          } catch (error) {
            if (error instanceof ApiError && error.response.status >= 400 && error.response.status < 500) {
              throw error;
            }
            return await transformFileInputsToBase64EncodedDataURIs(inputs);
          }
        default:
          throw new Error(`Unexpected file upload strategy: ${strategy}`);
      }
    }
    async function transformFileInputsToReplicateFileURLs(client, inputs) {
      return await transform(inputs, async (value) => {
        if (value instanceof Blob || value instanceof Buffer) {
          const file = await createFile.call(client, value);
          return file.urls.get;
        }
        return value;
      });
    }
    var MAX_DATA_URI_SIZE = 1e7;
    async function transformFileInputsToBase64EncodedDataURIs(inputs) {
      let totalBytes = 0;
      return await transform(inputs, async (value) => {
        let buffer;
        let mime;
        if (value instanceof Blob) {
          buffer = await value.arrayBuffer();
          mime = value.type;
        } else if (isTypedArray(value)) {
          buffer = value;
        } else {
          return value;
        }
        totalBytes += buffer.byteLength;
        if (totalBytes > MAX_DATA_URI_SIZE) {
          throw new Error(
            `Combined filesize of prediction ${totalBytes} bytes exceeds 10mb limit for inline encoding, please provide URLs instead`
          );
        }
        const data = bytesToBase64(buffer);
        mime = mime || "application/octet-stream";
        return `data:${mime};base64,${data}`;
      });
    }
    async function transform(value, mapper) {
      if (Array.isArray(value)) {
        const copy = [];
        for (const val of value) {
          const transformed = await transform(val, mapper);
          copy.push(transformed);
        }
        return copy;
      }
      if (isPlainObject(value)) {
        const copy = {};
        for (const key of Object.keys(value)) {
          copy[key] = await transform(value[key], mapper);
        }
        return copy;
      }
      return await mapper(value);
    }
    function isTypedArray(arr) {
      return arr instanceof Int8Array || arr instanceof Int16Array || arr instanceof Int32Array || arr instanceof Uint8Array || arr instanceof Uint8ClampedArray || arr instanceof Uint16Array || arr instanceof Uint32Array || arr instanceof Float32Array || arr instanceof Float64Array;
    }
    function isPlainObject(value) {
      const isObjectLike = typeof value === "object" && value !== null;
      if (!isObjectLike || String(value) !== "[object Object]") {
        return false;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto === null) {
        return true;
      }
      const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.toString.call(Ctor) === Function.prototype.toString.call(Object);
    }
    function parseProgressFromLogs(input) {
      const logs = typeof input === "object" && input.logs ? input.logs : input;
      if (!logs || typeof logs !== "string") {
        return null;
      }
      const pattern = /^\s*(\d+)%\s*\|.+?\|\s*(\d+)\/(\d+)/;
      const lines = logs.split("\n").reverse();
      for (const line of lines) {
        const matches = line.match(pattern);
        if (matches && matches.length === 4) {
          return {
            percentage: parseInt(matches[1], 10) / 100,
            current: parseInt(matches[2], 10),
            total: parseInt(matches[3], 10)
          };
        }
      }
      return null;
    }
    async function* streamAsyncIterator(stream) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    }
    module2.exports = {
      transform,
      transformFileInputs,
      validateWebhook,
      withAutomaticRetries,
      parseProgressFromLogs,
      streamAsyncIterator
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/vendor/eventsource-parser/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/vendor/eventsource-parser/stream.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable
            });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var input_exports = {};
    __export2(input_exports, {
      EventSourceParserStream: () => EventSourceParserStream
    });
    module2.exports = __toCommonJS2(input_exports);
    function createParser(onParse) {
      let isFirstChunk;
      let buffer;
      let startingPosition;
      let startingFieldLength;
      let eventId;
      let eventName;
      let data;
      reset();
      return {
        feed,
        reset
      };
      function reset() {
        isFirstChunk = true;
        buffer = "";
        startingPosition = 0;
        startingFieldLength = -1;
        eventId = void 0;
        eventName = void 0;
        data = "";
      }
      function feed(chunk) {
        buffer = buffer ? buffer + chunk : chunk;
        if (isFirstChunk && hasBom(buffer)) {
          buffer = buffer.slice(BOM.length);
        }
        isFirstChunk = false;
        const length = buffer.length;
        let position = 0;
        let discardTrailingNewline = false;
        while (position < length) {
          if (discardTrailingNewline) {
            if (buffer[position] === "\n") {
              ++position;
            }
            discardTrailingNewline = false;
          }
          let lineLength = -1;
          let fieldLength = startingFieldLength;
          let character;
          for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
            character = buffer[index];
            if (character === ":" && fieldLength < 0) {
              fieldLength = index - position;
            } else if (character === "\r") {
              discardTrailingNewline = true;
              lineLength = index - position;
            } else if (character === "\n") {
              lineLength = index - position;
            }
          }
          if (lineLength < 0) {
            startingPosition = length - position;
            startingFieldLength = fieldLength;
            break;
          } else {
            startingPosition = 0;
            startingFieldLength = -1;
          }
          parseEventStreamLine(buffer, position, fieldLength, lineLength);
          position += lineLength + 1;
        }
        if (position === length) {
          buffer = "";
        } else if (position > 0) {
          buffer = buffer.slice(position);
        }
      }
      function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
        if (lineLength === 0) {
          if (data.length > 0) {
            onParse({
              type: "event",
              id: eventId,
              event: eventName || void 0,
              data: data.slice(0, -1)
              // remove trailing newline
            });
            data = "";
            eventId = void 0;
          }
          eventName = void 0;
          return;
        }
        const noValue = fieldLength < 0;
        const field = lineBuffer.slice(
          index,
          index + (noValue ? lineLength : fieldLength)
        );
        let step = 0;
        if (noValue) {
          step = lineLength;
        } else if (lineBuffer[index + fieldLength + 1] === " ") {
          step = fieldLength + 2;
        } else {
          step = fieldLength + 1;
        }
        const position = index + step;
        const valueLength = lineLength - step;
        const value = lineBuffer.slice(position, position + valueLength).toString();
        if (field === "data") {
          data += value ? "".concat(value, "\n") : "\n";
        } else if (field === "event") {
          eventName = value;
        } else if (field === "id" && !value.includes("\0")) {
          eventId = value;
        } else if (field === "retry") {
          const retry = parseInt(value, 10);
          if (!Number.isNaN(retry)) {
            onParse({
              type: "reconnect-interval",
              value: retry
            });
          }
        }
      }
    }
    var BOM = [239, 187, 191];
    function hasBom(buffer) {
      return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
    }
    var EventSourceParserStream = class extends TransformStream {
      constructor() {
        let parser;
        super({
          start(controller) {
            parser = createParser((event) => {
              if (event.type === "event") {
                controller.enqueue(event);
              }
            });
          },
          transform(chunk) {
            parser.feed(chunk);
          }
        });
      }
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/vendor/streams-text-encoding/text-decoder-stream.js
var require_text_decoder_stream = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/vendor/streams-text-encoding/text-decoder-stream.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var input_exports = {};
    __export2(input_exports, {
      TextDecoderStream: () => TextDecoderStream
    });
    module2.exports = __toCommonJS2(input_exports);
    var decDecoder = Symbol("decDecoder");
    var decTransform = Symbol("decTransform");
    var TextDecodeTransformer = class {
      constructor(decoder) {
        this.decoder_ = decoder;
      }
      transform(chunk, controller) {
        if (!(chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
          throw new TypeError("Input data must be a BufferSource");
        }
        const text = this.decoder_.decode(chunk, { stream: true });
        if (text.length !== 0) {
          controller.enqueue(text);
        }
      }
      flush(controller) {
        const text = this.decoder_.decode();
        if (text.length !== 0) {
          controller.enqueue(text);
        }
      }
    };
    var TextDecoderStream = class {
      constructor(label, options) {
        const decoder = new TextDecoder(label || "utf-8", options || {});
        this[decDecoder] = decoder;
        this[decTransform] = new TransformStream(new TextDecodeTransformer(decoder));
      }
      get encoding() {
        return this[decDecoder].encoding;
      }
      get fatal() {
        return this[decDecoder].fatal;
      }
      get ignoreBOM() {
        return this[decDecoder].ignoreBOM;
      }
      get readable() {
        return this[decTransform].readable;
      }
      get writable() {
        return this[decTransform].writable;
      }
    };
    var encEncoder = Symbol("encEncoder");
    var encTransform = Symbol("encTransform");
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/stream.js
var require_stream2 = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/stream.js"(exports2, module2) {
    var ApiError = require_error();
    var { streamAsyncIterator } = require_util();
    var {
      EventSourceParserStream
    } = require_stream();
    var { TextDecoderStream } = typeof globalThis.TextDecoderStream === "undefined" ? require_text_decoder_stream() : globalThis;
    var ServerSentEvent = class {
      /**
       * Create a new server-sent event.
       *
       * @param {string} event The event name.
       * @param {string} data The event data.
       * @param {string} id The event ID.
       * @param {number} retry The retry time.
       */
      constructor(event, data, id, retry) {
        this.event = event;
        this.data = data;
        this.id = id;
        this.retry = retry;
      }
      /**
       * Convert the event to a string.
       */
      toString() {
        if (this.event === "output") {
          return this.data;
        }
        return "";
      }
    };
    function createReadableStream({ url, fetch: fetch2, options = {} }) {
      const { useFileOutput = true, headers = {}, ...initOptions } = options;
      const shouldProcessFileOutput = useFileOutput && isFileStream(url);
      return new ReadableStream({
        async start(controller) {
          const init2 = {
            ...initOptions,
            headers: {
              ...headers,
              Accept: "text/event-stream"
            }
          };
          const response = await fetch2(url, init2);
          if (!response.ok) {
            const text = await response.text();
            const request = new Request(url, init2);
            controller.error(
              new ApiError(
                `Request to ${url} failed with status ${response.status}: ${text}`,
                request,
                response
              )
            );
          }
          const stream = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
          for await (const event of streamAsyncIterator(stream)) {
            if (event.event === "error") {
              controller.error(new Error(event.data));
              break;
            }
            let data = event.data;
            if (event.event === "output" && shouldProcessFileOutput && typeof data === "string") {
              data = createFileOutput({ url: data, fetch: fetch2 });
            }
            controller.enqueue(new ServerSentEvent(event.event, data, event.id));
            if (event.event === "done") {
              break;
            }
          }
          controller.close();
        }
      });
    }
    function createFileOutput({ url, fetch: fetch2 }) {
      let type = "application/octet-stream";
      class FileOutput extends ReadableStream {
        async blob() {
          const chunks = [];
          for await (const chunk of this) {
            chunks.push(chunk);
          }
          return new Blob(chunks, { type });
        }
        url() {
          return new URL(url);
        }
        toString() {
          return url;
        }
      }
      return new FileOutput({
        async start(controller) {
          const response = await fetch2(url);
          if (!response.ok) {
            const text = await response.text();
            const request = new Request(url, init);
            controller.error(
              new ApiError(
                `Request to ${url} failed with status ${response.status}: ${text}`,
                request,
                response
              )
            );
          }
          if (response.headers.get("Content-Type")) {
            type = response.headers.get("Content-Type");
          }
          try {
            for await (const chunk of streamAsyncIterator(response.body)) {
              controller.enqueue(chunk);
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        }
      });
    }
    function isFileStream(url) {
      try {
        return new URL(url).pathname.startsWith("/v1/files/");
      } catch {
      }
      return false;
    }
    module2.exports = {
      createFileOutput,
      createReadableStream,
      ServerSentEvent
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/accounts.js
var require_accounts = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/accounts.js"(exports2, module2) {
    async function getCurrentAccount({ signal } = {}) {
      const response = await this.request("/account", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      current: getCurrentAccount
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/collections.js
var require_collections = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/collections.js"(exports2, module2) {
    async function getCollection(collection_slug, { signal } = {}) {
      const response = await this.request(`/collections/${collection_slug}`, {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function listCollections({ signal } = {}) {
      const response = await this.request("/collections", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = { get: getCollection, list: listCollections };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/deployments.js
var require_deployments = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/deployments.js"(exports2, module2) {
    var { transformFileInputs } = require_util();
    async function createPrediction(deployment_owner, deployment_name, options) {
      const { input, wait, signal, ...data } = options;
      if (data.webhook) {
        try {
          new URL(data.webhook);
        } catch (err) {
          throw new Error("Invalid webhook URL");
        }
      }
      const headers = {};
      if (wait) {
        if (typeof wait === "number") {
          const n = Math.max(1, Math.ceil(Number(wait)) || 1);
          headers["Prefer"] = `wait=${n}`;
        } else {
          headers["Prefer"] = "wait";
        }
      }
      const response = await this.request(
        `/deployments/${deployment_owner}/${deployment_name}/predictions`,
        {
          method: "POST",
          headers,
          data: {
            ...data,
            input: await transformFileInputs(
              this,
              input,
              this.fileEncodingStrategy
            )
          },
          signal
        }
      );
      return response.json();
    }
    async function getDeployment(deployment_owner, deployment_name, { signal } = {}) {
      const response = await this.request(
        `/deployments/${deployment_owner}/${deployment_name}`,
        {
          method: "GET",
          signal
        }
      );
      return response.json();
    }
    async function createDeployment(deployment_config, { signal } = {}) {
      const response = await this.request("/deployments", {
        method: "POST",
        data: deployment_config,
        signal
      });
      return response.json();
    }
    async function updateDeployment(deployment_owner, deployment_name, deployment_config, { signal } = {}) {
      const response = await this.request(
        `/deployments/${deployment_owner}/${deployment_name}`,
        {
          method: "PATCH",
          data: deployment_config,
          signal
        }
      );
      return response.json();
    }
    async function deleteDeployment(deployment_owner, deployment_name, { signal } = {}) {
      const response = await this.request(
        `/deployments/${deployment_owner}/${deployment_name}`,
        {
          method: "DELETE",
          signal
        }
      );
      return response.status === 204;
    }
    async function listDeployments({ signal } = {}) {
      const response = await this.request("/deployments", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      predictions: {
        create: createPrediction
      },
      get: getDeployment,
      create: createDeployment,
      update: updateDeployment,
      list: listDeployments,
      delete: deleteDeployment
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/hardware.js
var require_hardware = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/hardware.js"(exports2, module2) {
    async function listHardware({ signal } = {}) {
      const response = await this.request("/hardware", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      list: listHardware
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/models.js
var require_models = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/models.js"(exports2, module2) {
    async function getModel(model_owner, model_name, { signal } = {}) {
      const response = await this.request(`/models/${model_owner}/${model_name}`, {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function listModelVersions(model_owner, model_name, { signal } = {}) {
      const response = await this.request(
        `/models/${model_owner}/${model_name}/versions`,
        {
          method: "GET",
          signal
        }
      );
      return response.json();
    }
    async function getModelVersion(model_owner, model_name, version_id, { signal } = {}) {
      const response = await this.request(
        `/models/${model_owner}/${model_name}/versions/${version_id}`,
        {
          method: "GET",
          signal
        }
      );
      return response.json();
    }
    async function listModels({ signal } = {}) {
      const response = await this.request("/models", {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function createModel(model_owner, model_name, options) {
      const { signal, ...rest } = options;
      const data = { owner: model_owner, name: model_name, ...rest };
      const response = await this.request("/models", {
        method: "POST",
        data,
        signal
      });
      return response.json();
    }
    async function search(query, { signal } = {}) {
      const response = await this.request("/models", {
        method: "QUERY",
        headers: {
          "Content-Type": "text/plain"
        },
        data: query,
        signal
      });
      return response.json();
    }
    module2.exports = {
      get: getModel,
      list: listModels,
      create: createModel,
      versions: { list: listModelVersions, get: getModelVersion },
      search
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/predictions.js
var require_predictions = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/predictions.js"(exports2, module2) {
    var { transformFileInputs } = require_util();
    async function createPrediction(options) {
      const { model, version, input, wait, signal, ...data } = options;
      if (data.webhook) {
        try {
          new URL(data.webhook);
        } catch (err) {
          throw new Error("Invalid webhook URL");
        }
      }
      const headers = {};
      if (wait) {
        if (typeof wait === "number") {
          const n = Math.max(1, Math.ceil(Number(wait)) || 1);
          headers["Prefer"] = `wait=${n}`;
        } else {
          headers["Prefer"] = "wait";
        }
      }
      let response;
      if (version) {
        response = await this.request("/predictions", {
          method: "POST",
          headers,
          data: {
            ...data,
            input: await transformFileInputs(
              this,
              input,
              this.fileEncodingStrategy
            ),
            version
          },
          signal
        });
      } else if (model) {
        response = await this.request(`/models/${model}/predictions`, {
          method: "POST",
          headers,
          data: {
            ...data,
            input: await transformFileInputs(
              this,
              input,
              this.fileEncodingStrategy
            )
          },
          signal
        });
      } else {
        throw new Error("Either model or version must be specified");
      }
      return response.json();
    }
    async function getPrediction(prediction_id, { signal } = {}) {
      const response = await this.request(`/predictions/${prediction_id}`, {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function cancelPrediction(prediction_id, { signal } = {}) {
      const response = await this.request(`/predictions/${prediction_id}/cancel`, {
        method: "POST",
        signal
      });
      return response.json();
    }
    async function listPredictions({ signal } = {}) {
      const response = await this.request("/predictions", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      create: createPrediction,
      get: getPrediction,
      cancel: cancelPrediction,
      list: listPredictions
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/trainings.js
var require_trainings = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/trainings.js"(exports2, module2) {
    async function createTraining(model_owner, model_name, version_id, options) {
      const { signal, ...data } = options;
      if (data.webhook) {
        try {
          new URL(data.webhook);
        } catch (err) {
          throw new Error("Invalid webhook URL");
        }
      }
      const response = await this.request(
        `/models/${model_owner}/${model_name}/versions/${version_id}/trainings`,
        {
          method: "POST",
          data,
          signal
        }
      );
      return response.json();
    }
    async function getTraining(training_id, { signal } = {}) {
      const response = await this.request(`/trainings/${training_id}`, {
        method: "GET",
        signal
      });
      return response.json();
    }
    async function cancelTraining(training_id, { signal } = {}) {
      const response = await this.request(`/trainings/${training_id}/cancel`, {
        method: "POST",
        signal
      });
      return response.json();
    }
    async function listTrainings({ signal } = {}) {
      const response = await this.request("/trainings", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      create: createTraining,
      get: getTraining,
      cancel: cancelTraining,
      list: listTrainings
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/webhooks.js
var require_webhooks = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/lib/webhooks.js"(exports2, module2) {
    async function getDefaultWebhookSecret({ signal } = {}) {
      const response = await this.request("/webhooks/default/secret", {
        method: "GET",
        signal
      });
      return response.json();
    }
    module2.exports = {
      default: {
        secret: {
          get: getDefaultWebhookSecret
        }
      }
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/package.json
var require_package = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/package.json"(exports2, module2) {
    module2.exports = {
      name: "replicate",
      version: "1.4.0",
      description: "JavaScript client for Replicate",
      repository: "github:replicate/replicate-javascript",
      homepage: "https://github.com/replicate/replicate-javascript#readme",
      bugs: "https://github.com/replicate/replicate-javascript/issues",
      license: "Apache-2.0",
      main: "index.js",
      type: "commonjs",
      types: "index.d.ts",
      files: [
        "CONTRIBUTING.md",
        "LICENSE",
        "README.md",
        "index.d.ts",
        "index.js",
        "lib/**/*.js",
        "vendor/**/*",
        "package.json"
      ],
      engines: {
        node: ">=18.0.0",
        npm: ">=7.19.0",
        git: ">=2.11.0",
        yarn: ">=1.7.0"
      },
      scripts: {
        check: "tsc",
        format: "biome format . --write",
        "lint-biome": "biome lint .",
        "lint-publint": "publint",
        lint: "npm run lint-biome && npm run lint-publint",
        test: "jest"
      },
      optionalDependencies: {
        "readable-stream": ">=4.0.0"
      },
      devDependencies: {
        "@biomejs/biome": "^1.4.1",
        "@types/jest": "^29.5.3",
        "@typescript-eslint/eslint-plugin": "^5.56.0",
        "cross-fetch": "^3.1.5",
        jest: "^29.7.0",
        nock: "^14.0.0-beta.6",
        publint: "^0.2.7",
        "ts-jest": "^29.1.0",
        typescript: "^5.0.2"
      }
    };
  }
});

// node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/index.js
var require_replicate = __commonJS({
  "node_modules/.pnpm/replicate@1.4.0/node_modules/replicate/index.js"(exports2, module2) {
    var ApiError = require_error();
    var ModelVersionIdentifier = require_identifier();
    var { createReadableStream, createFileOutput } = require_stream2();
    var {
      transform,
      withAutomaticRetries,
      validateWebhook,
      parseProgressFromLogs,
      streamAsyncIterator
    } = require_util();
    var accounts = require_accounts();
    var collections = require_collections();
    var deployments = require_deployments();
    var files = require_files();
    var hardware = require_hardware();
    var models = require_models();
    var predictions = require_predictions();
    var trainings = require_trainings();
    var webhooks = require_webhooks();
    var packageJSON = require_package();
    var Replicate2 = class {
      /**
       * Create a new Replicate API client instance.
       *
       * @param {object} options - Configuration options for the client
       * @param {string} options.auth - API access token. Defaults to the `REPLICATE_API_TOKEN` environment variable.
       * @param {string} options.userAgent - Identifier of your app
       * @param {string} [options.baseUrl] - Defaults to https://api.replicate.com/v1
       * @param {Function} [options.fetch] - Fetch function to use. Defaults to `globalThis.fetch`
       * @param {boolean} [options.useFileOutput] - Set to `false` to disable `FileOutput` objects from `run` instead of URLs, defaults to true.
       * @param {"default" | "upload" | "data-uri"} [options.fileEncodingStrategy] - Determines the file encoding strategy to use
       */
      constructor(options = {}) {
        this.auth = options.auth || (typeof process !== "undefined" ? process.env.REPLICATE_API_TOKEN : null);
        this.userAgent = options.userAgent || `replicate-javascript/${packageJSON.version}`;
        this.baseUrl = options.baseUrl || "https://api.replicate.com/v1";
        this.fetch = options.fetch || globalThis.fetch;
        this.fileEncodingStrategy = options.fileEncodingStrategy || "default";
        this.useFileOutput = options.useFileOutput === false ? false : true;
        this.accounts = {
          current: accounts.current.bind(this)
        };
        this.collections = {
          list: collections.list.bind(this),
          get: collections.get.bind(this)
        };
        this.deployments = {
          get: deployments.get.bind(this),
          create: deployments.create.bind(this),
          update: deployments.update.bind(this),
          delete: deployments.delete.bind(this),
          list: deployments.list.bind(this),
          predictions: {
            create: deployments.predictions.create.bind(this)
          }
        };
        this.files = {
          create: files.create.bind(this),
          get: files.get.bind(this),
          list: files.list.bind(this),
          delete: files.delete.bind(this)
        };
        this.hardware = {
          list: hardware.list.bind(this)
        };
        this.models = {
          get: models.get.bind(this),
          list: models.list.bind(this),
          create: models.create.bind(this),
          versions: {
            list: models.versions.list.bind(this),
            get: models.versions.get.bind(this)
          },
          search: models.search.bind(this)
        };
        this.predictions = {
          create: predictions.create.bind(this),
          get: predictions.get.bind(this),
          cancel: predictions.cancel.bind(this),
          list: predictions.list.bind(this)
        };
        this.trainings = {
          create: trainings.create.bind(this),
          get: trainings.get.bind(this),
          cancel: trainings.cancel.bind(this),
          list: trainings.list.bind(this)
        };
        this.webhooks = {
          default: {
            secret: {
              get: webhooks.default.secret.get.bind(this)
            }
          }
        };
      }
      /**
       * Run a model and wait for its output.
       *
       * @param {string} ref - Required. The model version identifier in the format "owner/name" or "owner/name:version"
       * @param {object} options
       * @param {object} options.input - Required. An object with the model inputs
       * @param {{mode: "block", timeout?: number, interval?: number} | {mode: "poll", interval?: number }} [options.wait] - Options for waiting for the prediction to finish. If `wait` is explicitly true, the function will block and wait for the prediction to finish.
       * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
       * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
       * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
       * @param {Function} [progress] - Callback function that receives the prediction object as it's updated. The function is called when the prediction is created, each time its updated while polling for completion, and when it's completed.
       * @throws {Error} If the reference is invalid
       * @throws {Error} If the prediction failed
       * @returns {Promise<object>} - Resolves with the output of running the model
       */
      async run(ref, options, progress) {
        const { wait = { mode: "block" }, signal, ...data } = options;
        const identifier = ModelVersionIdentifier.parse(ref);
        let prediction;
        if (identifier.version) {
          prediction = await this.predictions.create({
            ...data,
            version: identifier.version,
            wait: wait.mode === "block" ? wait.timeout ?? true : false
          });
        } else if (identifier.owner && identifier.name) {
          prediction = await this.predictions.create({
            ...data,
            model: `${identifier.owner}/${identifier.name}`,
            wait: wait.mode === "block" ? wait.timeout ?? true : false
          });
        } else {
          throw new Error("Invalid model version identifier");
        }
        if (progress) {
          progress(prediction);
        }
        const isDone = wait.mode === "block" && prediction.status !== "starting";
        if (!isDone) {
          prediction = await this.wait(
            prediction,
            { interval: wait.mode === "poll" ? wait.interval : void 0 },
            async (updatedPrediction) => {
              if (progress) {
                progress(updatedPrediction);
              }
              if (signal && signal.aborted) {
                return true;
              }
              return false;
            }
          );
        }
        if (signal && signal.aborted) {
          prediction = await this.predictions.cancel(prediction.id);
        }
        if (progress) {
          progress(prediction);
        }
        if (prediction.status === "failed") {
          throw new Error(`Prediction failed: ${prediction.error}`);
        }
        return transform(prediction.output, (value) => {
          if (typeof value === "string" && (value.startsWith("https:") || value.startsWith("data:"))) {
            return this.useFileOutput ? createFileOutput({ url: value, fetch: this.fetch }) : value;
          }
          return value;
        });
      }
      /**
       * Make a request to the Replicate API.
       *
       * @param {string} route - REST API endpoint path
       * @param {object} options - Request parameters
       * @param {string} [options.method] - HTTP method. Defaults to GET
       * @param {object} [options.params] - Query parameters
       * @param {object|Headers} [options.headers] - HTTP headers
       * @param {object} [options.data] - Body parameters
       * @param {AbortSignal} [options.signal] - AbortSignal to cancel the request
       * @returns {Promise<Response>} - Resolves with the response object
       * @throws {ApiError} If the request failed
       */
      async request(route, options) {
        const { auth, baseUrl, userAgent } = this;
        let url;
        if (route instanceof URL) {
          url = route;
        } else {
          url = new URL(
            route.startsWith("/") ? route.slice(1) : route,
            baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
          );
        }
        const { method = "GET", params = {}, data, signal } = options;
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.append(key, value);
        }
        const headers = {
          "Content-Type": "application/json",
          "User-Agent": userAgent
        };
        if (auth) {
          headers["Authorization"] = `Bearer ${auth}`;
        }
        if (options.headers) {
          for (const [key, value] of Object.entries(options.headers)) {
            headers[key] = value;
          }
        }
        let body = void 0;
        if (data instanceof FormData) {
          body = data;
          delete headers["Content-Type"];
        } else if (data) {
          body = JSON.stringify(data);
        }
        const init2 = {
          method,
          headers,
          body,
          signal
        };
        const shouldRetry = method === "GET" ? (response2) => response2.status === 429 || response2.status >= 500 : (response2) => response2.status === 429;
        const _fetch = this.fetch;
        const response = await withAutomaticRetries(async () => _fetch(url, init2), {
          shouldRetry
        });
        if (!response.ok) {
          const request = new Request(url, init2);
          const responseText = await response.text();
          throw new ApiError(
            `Request to ${url} failed with status ${response.status} ${response.statusText}: ${responseText}.`,
            request,
            response
          );
        }
        return response;
      }
      /**
       * Stream a model and wait for its output.
       *
       * @param {string} identifier - Required. The model version identifier in the format "{owner}/{name}:{version}"
       * @param {object} options
       * @param {object} options.input - Required. An object with the model inputs
       * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
       * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
       * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
       * @throws {Error} If the prediction failed
       * @yields {ServerSentEvent} Each streamed event from the prediction
       */
      async *stream(ref, options) {
        const {
          wait,
          signal,
          useFileOutput = this.useFileOutput,
          ...data
        } = options;
        const identifier = ModelVersionIdentifier.parse(ref);
        let prediction;
        if (identifier.version) {
          prediction = await this.predictions.create({
            ...data,
            version: identifier.version
          });
        } else if (identifier.owner && identifier.name) {
          prediction = await this.predictions.create({
            ...data,
            model: `${identifier.owner}/${identifier.name}`
          });
        } else {
          throw new Error("Invalid model version identifier");
        }
        if (prediction.urls && prediction.urls.stream) {
          const stream = createReadableStream({
            url: prediction.urls.stream,
            fetch: this.fetch,
            options: {
              useFileOutput,
              ...signal ? { signal } : {}
            }
          });
          yield* streamAsyncIterator(stream);
        } else {
          throw new Error("Prediction does not support streaming");
        }
      }
      /**
       * Paginate through a list of results.
       *
       * @generator
       * @example
       * for await (const page of replicate.paginate(replicate.predictions.list) {
       *    console.log(page);
       * }
       * @param {Function} endpoint - Function that returns a promise for the next page of results
       * @param {object} [options]
       * @param {AbortSignal} [options.signal] - AbortSignal to cancel the request.
       * @yields {object[]} Each page of results
       */
      async *paginate(endpoint, options = {}) {
        const response = await endpoint();
        yield response.results;
        if (response.next && !(options.signal && options.signal.aborted)) {
          const nextPage = () => this.request(response.next, {
            method: "GET",
            signal: options.signal
          }).then((r) => r.json());
          yield* this.paginate(nextPage, options);
        }
      }
      /**
       * Wait for a prediction to finish.
       *
       * If the prediction has already finished,
       * this function returns immediately.
       * Otherwise, it polls the API until the prediction finishes.
       *
       * @async
       * @param {object} prediction - Prediction object
       * @param {object} options - Options
       * @param {number} [options.interval] - Polling interval in milliseconds. Defaults to 500
       * @param {Function} [stop] - Async callback function that is called after each polling attempt. Receives the prediction object as an argument. Return false to cancel polling.
       * @throws {Error} If the prediction doesn't complete within the maximum number of attempts
       * @throws {Error} If the prediction failed
       * @returns {Promise<object>} Resolves with the completed prediction object
       */
      async wait(prediction, options, stop) {
        const { id } = prediction;
        if (!id) {
          throw new Error("Invalid prediction");
        }
        if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
          return prediction;
        }
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const interval = options && options.interval || 500;
        let updatedPrediction = await this.predictions.get(id);
        while (updatedPrediction.status !== "succeeded" && updatedPrediction.status !== "failed" && updatedPrediction.status !== "canceled") {
          if (stop && await stop(updatedPrediction) === true) {
            break;
          }
          await sleep(interval);
          updatedPrediction = await this.predictions.get(prediction.id);
        }
        if (updatedPrediction.status === "failed") {
          throw new Error(`Prediction failed: ${updatedPrediction.error}`);
        }
        return updatedPrediction;
      }
    };
    module2.exports = Replicate2;
    module2.exports.validateWebhook = validateWebhook;
    module2.exports.parseProgressFromLogs = parseProgressFromLogs;
  }
});

// apps/api/src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express10 = __toESM(require("express"));
var import_pino_http = __toESM(require("pino-http"));

// apps/api/src/lib/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({
  level: process.env["NODE_ENV"] === "production" ? "info" : "debug",
  ...process.env["NODE_ENV"] !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// packages/shared/src/plans.ts
var PLANS = {
  free: {
    id: "free",
    label: "Free",
    price: 0,
    monthlyLimit: 2,
    features: ["2 generations / month", "Limited template library", "Standard quality"]
  },
  pro: {
    id: "pro",
    label: "Pro",
    price: 19,
    monthlyLimit: 200,
    features: ["200 generations / month", "Full daily template library", "HD downloads"]
  },
  studio: {
    id: "studio",
    label: "Studio",
    price: 49,
    monthlyLimit: Infinity,
    features: [
      "Unlimited generations (fair use)",
      "Full library + early access",
      "Priority generation"
    ]
  }
};

// packages/shared/src/schemas.ts
var import_zod = require("zod");
var PlanIdSchema = import_zod.z.enum(["free", "pro", "studio"]);
var UserDocSchema = import_zod.z.object({
  uid: import_zod.z.string(),
  email: import_zod.z.string().email(),
  displayName: import_zod.z.string().nullable().default(null),
  tier: PlanIdSchema.default("free"),
  generationsUsed: import_zod.z.number().int().nonnegative().default(0),
  generationsResetAt: import_zod.z.string().datetime().optional(),
  polarCustomerId: import_zod.z.string().optional(),
  createdAt: import_zod.z.string().datetime(),
  updatedAt: import_zod.z.string().datetime()
});
var TemplateSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  emoji: import_zod.z.string(),
  label: import_zod.z.string(),
  style: import_zod.z.string(),
  styleName: import_zod.z.string().optional(),
  cat: import_zod.z.string(),
  prompt: import_zod.z.string(),
  image: import_zod.z.string(),
  isTrending: import_zod.z.boolean().default(false),
  isNew: import_zod.z.boolean().default(false),
  isPro: import_zod.z.boolean().default(false),
  isCouple: import_zod.z.boolean().optional(),
  likes: import_zod.z.number().int().nonnegative().default(0),
  uses: import_zod.z.number().int().nonnegative().default(0),
  createdAt: import_zod.z.string().datetime()
});
var GenerationRunSchema = import_zod.z.object({
  date: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: import_zod.z.enum(["pending", "completed", "failed"]),
  templatesGenerated: import_zod.z.number().int().nonnegative().default(0),
  startedAt: import_zod.z.string().datetime(),
  completedAt: import_zod.z.string().datetime().optional(),
  error: import_zod.z.string().optional()
});
var WebhookEventSchema = import_zod.z.object({
  eventId: import_zod.z.string(),
  type: import_zod.z.string(),
  processedAt: import_zod.z.string().datetime()
});
var CheckoutRequestSchema = import_zod.z.object({
  planId: import_zod.z.enum(["pro", "studio"])
});
var GenerateRequestSchema = import_zod.z.object({
  prompt: import_zod.z.string().min(1).max(2e3),
  imageBase64: import_zod.z.string().optional(),
  imageBase64_2: import_zod.z.string().optional(),
  templateBase64: import_zod.z.string().optional(),
  templateId: import_zod.z.string().optional(),
  templateImageSrc: import_zod.z.string().optional()
});

// packages/shared/src/errors.ts
var AppError = class extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
};
var UnauthorizedError = class extends AppError {
  constructor(msg = "Unauthorized") {
    super("UNAUTHORIZED", msg, 401);
  }
};
var NotFoundError = class extends AppError {
  constructor(resource) {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
};
var ValidationError = class extends AppError {
  constructor(msg) {
    super("VALIDATION_ERROR", msg, 400);
  }
};
var QuotaExceededError = class extends AppError {
  constructor() {
    super("QUOTA_EXCEEDED", "Monthly generation limit reached. Upgrade your plan to continue.", 429);
  }
};
var RateLimitError = class extends AppError {
  constructor() {
    super("RATE_LIMITED", "Too many requests. Please slow down.", 429);
  }
};

// apps/api/src/middleware/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  const msg = err instanceof Error ? err.message : String(err);
  logger.error({ err, msg }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Internal server error" }
  });
}

// apps/api/src/routes/webhooks.ts
var import_express = require("express");
var import_express2 = __toESM(require("express"));

// apps/api/src/lib/firebase.ts
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var import_auth = require("firebase-admin/auth");
var import_storage = require("firebase-admin/storage");
var _app = null;
function getApp() {
  if (_app) return _app;
  if ((0, import_app.getApps)().length > 0) {
    _app = (0, import_app.getApps)()[0];
    return _app;
  }
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
  const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars."
    );
  }
  const storageBucket = process.env["FIREBASE_STORAGE_BUCKET"] ?? `${projectId}.firebasestorage.app`;
  _app = (0, import_app.initializeApp)({ credential: (0, import_app.cert)({ projectId, clientEmail, privateKey }), storageBucket });
  return _app;
}
var db = new Proxy({}, {
  get(_target, prop) {
    return (0, import_firestore.getFirestore)(getApp())[prop];
  }
});
var adminAuth = new Proxy({}, {
  get(_target, prop) {
    return (0, import_auth.getAuth)(getApp())[prop];
  }
});
var adminStorage = new Proxy({}, {
  get(_target, prop) {
    return (0, import_storage.getStorage)(getApp())[prop];
  }
});

// apps/api/src/lib/polarConfig.ts
var POLAR_PRODUCT_IDS = {
  pro: process.env["POLAR_PRODUCT_PRO"] ?? "",
  studio: process.env["POLAR_PRODUCT_STUDIO"] ?? ""
};
function getPlanByProductId(productId) {
  if (!productId) return void 0;
  if (POLAR_PRODUCT_IDS.pro && POLAR_PRODUCT_IDS.pro === productId) return "pro";
  if (POLAR_PRODUCT_IDS.studio && POLAR_PRODUCT_IDS.studio === productId) return "studio";
  return void 0;
}
function getProductIdByPlan(planId) {
  return POLAR_PRODUCT_IDS[planId];
}

// apps/api/src/routes/webhooks.ts
var router = (0, import_express.Router)();
router.post("/polar", import_express2.default.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    const { validateEvent } = await import("@polar-sh/sdk/webhooks");
    event = validateEvent(
      req.body,
      req.headers,
      process.env["POLAR_WEBHOOK_SECRET"]
    );
  } catch (e) {
    const err = e;
    if (err?.name === "WebhookVerificationError" || err?.constructor?.name === "WebhookVerificationError") {
      logger.warn("Polar webhook: signature verification failed");
      res.status(403).json({ error: { code: "INVALID_SIGNATURE", message: "Invalid signature" } });
      return;
    }
    logger.warn({ err: e }, "Polar webhook: parse error");
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Bad request" } });
    return;
  }
  const eventType = event.type ?? "unknown";
  const data = event.data;
  const idempotencyKey = `${data?.id ?? ""}-${eventType}`;
  const eventRef = db.collection("webhookEvents").doc(idempotencyKey);
  const existing = await eventRef.get();
  if (existing.exists) {
    res.json({ ok: true, skipped: true });
    return;
  }
  try {
    await handlePolarEvent(eventType, data);
    await eventRef.set({
      eventKey: idempotencyKey,
      type: eventType,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ ok: true });
  } catch (e) {
    logger.error(e, "Polar webhook: processing error");
    res.status(500).json({ error: { code: "PROCESSING_ERROR", message: "Processing failed" } });
  }
});
async function handlePolarEvent(type, data) {
  logger.info({ type }, "Processing Polar webhook");
  if (type === "subscription.active" || type === "subscription.updated") {
    const productId = data?.productId;
    const customerId = data?.customerId;
    const customerEmail = data?.customer?.email;
    if (!customerEmail) {
      logger.warn({ type }, "Webhook: no customer email");
      return;
    }
    const newTier = productId ? getPlanByProductId(productId) ?? "free" : "free";
    const snap = await db.collection("users").where("email", "==", customerEmail).limit(1).get();
    if (snap.empty) {
      logger.warn({ type }, "Webhook: user not found for email");
      return;
    }
    await snap.docs[0].ref.update({
      tier: newTier,
      polarCustomerId: customerId ?? null,
      generationsUsed: 0,
      generationsResetAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info({ tier: newTier }, "Webhook: user tier updated");
  }
  if (type === "subscription.canceled" || type === "subscription.revoked") {
    const customerEmail = data?.customer?.email;
    if (!customerEmail) return;
    const snap = await db.collection("users").where("email", "==", customerEmail).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        tier: "free",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      logger.info("Webhook: user downgraded to free");
    }
  }
}
var webhooks_default = router;

// apps/api/src/routes/users.ts
var import_express3 = require("express");

// apps/api/src/middleware/auth.ts
async function ensureAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid Authorization header"));
  }
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    req.uid = decoded.uid;
    next();
  } catch (e) {
    if (e instanceof Error && e.message.includes("Firebase Admin credentials not configured")) {
      next(new UnauthorizedError("Server not configured: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required"));
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

// apps/api/src/services/userService.ts
async function ensureUser(uid, authUser) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const doc = UserDocSchema.parse({
    uid,
    email: authUser?.email ?? "",
    displayName: authUser?.displayName ?? null,
    tier: "free",
    generationsUsed: 0,
    createdAt: now,
    updatedAt: now
  });
  await ref.set(doc);
}
async function getUserDoc(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data() : null;
}

// apps/api/src/routes/users.ts
var router2 = (0, import_express3.Router)();
router2.get("/me", ensureAuth, async (req, res, next) => {
  try {
    const user = await getUserDoc(req.uid);
    if (!user) return next(new NotFoundError("User"));
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
router2.post("/me", ensureAuth, async (req, res, next) => {
  try {
    const authUser = await adminAuth.getUser(req.uid);
    await ensureUser(req.uid, {
      email: authUser.email,
      displayName: authUser.displayName
    });
    res.json({ uid: req.uid });
  } catch (e) {
    next(e);
  }
});
var users_default = router2;

// apps/api/src/routes/templates.ts
var import_express4 = require("express");
var router3 = (0, import_express4.Router)();
var NOW = "2026-06-18T00:00:00.000Z";
var STATIC_TEMPLATES = [
  {
    id: "24",
    emoji: "\u26BE",
    label: "Baseball Stadium Cam",
    style: "Cinematic",
    styleName: "Cinematic",
    cat: "kdrama",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_mp2jsfmp2jsfmp2j.png",
    prompt: "Photorealistic broadcast TV camera screenshot of a young woman accidentally caught on live Korean baseball KBO broadcast camera, she notices the camera and gives a soft natural smile directly into the lens, relaxed and candid moment. She is seated in stadium bleachers wearing a dark navy Doosan Bears jersey. She is holding red thunder sticks loosely in her lap. Background is softly blurred \u2014 a few calm seated fans behind her, no chaos or movement. Stadium lighting is cool blue-tinted LED floodlights, cinematic night game atmosphere. Shallow depth of field, subject is sharp and in focus. Framed as a live TV broadcast screenshot: scoreboard graphic overlay in top-left corner with Korean team names and score, fictional Korean sports channel logo top-right corner reading 'KSBN LIVE' in clean broadcast font. Lower-third Korean text subtitle visible at bottom. The overall feel is calm, beautiful, intimate \u2014 like a quiet moment caught by the broadcast camera. Hyper-realistic, 4K broadcast quality, film grain, cinematic."
  },
  {
    id: "25",
    emoji: "\u{1F495}",
    label: "Fashion Doll",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_7aatlu7aatlu7aat.png",
    prompt: "Ultra-stylish fashion editorial photo transformed into a living doll aesthetic. Subject styled as a hyper-glamorous Y2K fashion doll \u2014 flawless porcelain skin, big sparkling eyes with lash extensions, glossy pink lips, perfectly sculpted cheekbones. Wearing a chic pink mini dress with satin ribbon details, pearl accessories, and platform heels. Background is a dreamy pastel pink studio with soft bokeh. Lighting is high-key fashion photography with ring light catchlights in the eyes. The overall feel is playful, luxurious, and fashion-forward \u2014 like a Barbie come to life. Hyper-realistic, editorial quality, 4K, fashion magazine cover aesthetic."
  },
  {
    id: "26",
    emoji: "\u{1F4F8}",
    label: "Magazine Cover",
    style: "Editorial",
    styleName: "Editorial",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_b5jmleb5jmleb5jm.png",
    prompt: "Hyper-realistic high-fashion magazine cover photo shoot. Subject transformed into a stunning editorial model on the cover of a prestigious fashion magazine. Flawless retouched skin, dramatic makeup \u2014 sharp contour, bold lip, sculpted brows. Wearing a couture designer outfit \u2014 structured blazer or avant-garde dress in bold color. Shot against a clean studio background or iconic cityscape. Lighting is dramatic fashion photography \u2014 strong key light, sculpted shadows, magazine-quality retouching. Magazine logo in bold serif font at the top, cover lines with fashion headlines overlaid. The overall feel is powerful, glamorous, and iconic \u2014 a real magazine cover moment. Hyper-realistic, 4K, Vogue/Harper's Bazaar editorial quality."
  },
  {
    id: "27",
    emoji: "\u{1F324}\uFE0F",
    label: "Windy Day",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_w4se3zw4se3zw4se.png",
    prompt: "Cinematic outdoor portrait on a beautifully windy day. Subject's hair flowing naturally in the breeze, candid and carefree expression. Soft natural daylight with scattered clouds creating dynamic shadow play. Subject wearing a light flowy dress or oversized jacket. Background is an open field, coastal cliff, or city street with leaves drifting past. The wind adds movement and life to every element of the frame \u2014 hair, fabric, surrounding foliage. Shallow depth of field, warm-toned color grade, film photography aesthetic. The overall mood is free-spirited, romantic, and effortlessly beautiful. Hyper-realistic, 4K, editorial outdoor photography."
  },
  {
    id: "28",
    emoji: "\u2728",
    label: "Golden Hour",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_x0qd5xx0qd5xx0qd.png",
    prompt: "Stunning golden hour portrait bathed in warm sunset light. Subject glowing with the magical hour light \u2014 skin luminous with warm orange and amber tones, soft rim lighting creating a natural halo effect. Shot outdoors \u2014 open field, rooftop, beach, or hilltop. The sun is low on the horizon creating long shadows and lens flares. Subject is relaxed and radiant, wearing something light and airy. Background sky is a gradient of deep orange, pink, and purple. The overall mood is dreamy, warm, and cinematic \u2014 the perfect end-of-day glow. Hyper-realistic, 4K, golden hour photography."
  },
  {
    id: "29",
    emoji: "\u{1F305}",
    label: "Morning Glow",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_y38do0y38do0y38d.png",
    prompt: "Soft and luminous morning portrait in the first light of day. Subject waking up to gentle sunrise light streaming through sheer curtains or captured outdoors at dawn. Skin looks dewy and naturally glowing \u2014 warm peachy tones, minimal makeup, fresh-faced beauty. Wearing a cozy oversized sweater, silk robe, or simple white outfit. Background is soft and airy \u2014 bedroom window, balcony, or misty morning landscape. Light is diffused and golden, creating an ethereal haze. The overall mood is calm, intimate, and beautifully soft \u2014 the quiet magic of early morning. Hyper-realistic, 4K, soft morning light photography."
  },
  {
    id: "30",
    emoji: "\u{1F497}",
    label: "Hotel Glam",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_aqvtgtaqvtgtaqvt.png",
    prompt: "Ultra-glamorous luxury hotel room portrait. Subject looking effortlessly chic in a five-star hotel setting \u2014 marble bathroom, plush king-size bed with crisp white linens, floor-to-ceiling windows with city skyline view. Dressed in a silk slip dress or elegant loungewear. Makeup is polished and glam \u2014 glossy lips, defined eyes. Lighting is a mix of warm bedside lamps and cool ambient window light creating a moody, luxurious atmosphere. The vibe is aspirational travel content meets fashion editorial \u2014 rich textures, opulent details, cinematic color grade. Hyper-realistic, 4K, luxury lifestyle photography."
  },
  {
    id: "31",
    emoji: "\u{1F3AC}",
    label: "Scream Night",
    style: "Horror",
    styleName: "Horror",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_a3rcpta3rcpta3rc.png",
    prompt: "Cinematic horror movie still inspired by classic slasher films. Subject styled as the iconic final girl \u2014 wide frightened eyes, disheveled hair, torn or blood-splattered clothing. Scene set at night in a dark suburban street, haunted house, or dimly lit corridor. Dramatic chiaroscuro lighting with harsh shadows and a single flickering light source. Color grade is desaturated with deep blues and harsh white highlights \u2014 classic horror film look. The overall atmosphere is terrifying, suspenseful, and cinematic \u2014 like a frame from a 90s horror blockbuster. Hyper-realistic, 4K, horror film cinematography."
  },
  {
    id: "35",
    emoji: "\u{1FA75}",
    label: "Cyan Editorial",
    style: "Editorial",
    styleName: "Editorial",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/cyan-editorial.jpg",
    prompt: "Close-up editorial portrait. Subject with flowing auburn brown hair, smoky eye makeup and deep berry lip. Shot against a bold cyan blue geometric background with dramatic shadows. Intense gaze directed slightly upward, confident expression. Soft natural skin texture, fashion magazine quality lighting. High fashion editorial photography, 4K."
  },
  {
    id: "36",
    emoji: "\u{1F338}",
    label: "Pink Beauty",
    style: "Beauty",
    styleName: "Beauty",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/pink-beauty.jpg",
    prompt: "Minimalist beauty portrait. Subject with dark hair swept up in a loose bun with soft curtain bangs framing the face. Wearing gold hoop earrings and a delicate gold chain necklace. Soft pink pastel background, clean natural makeup, dewy skin, golden-brown eyes. Intimate close-up, beauty campaign aesthetic, soft diffused studio lighting. High fashion beauty photography, 4K."
  },
  {
    id: "37",
    emoji: "\u{1F9E5}",
    label: "Denim Edge",
    style: "Street",
    styleName: "Street",
    cat: "urban",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/denim-edge.jpg",
    prompt: "Street fashion portrait. Subject with dramatic dark hair swept up in a tousled updo, wearing a classic blue denim jacket over a white tee and large silver hoop earrings. Soft coral lip, strong brow, intense direct gaze into camera. Muted pink urban wall background. Cool-girl street style meets editorial fashion. Portrait format, natural light, 4K."
  },
  {
    id: "38",
    emoji: "\u{1F499}",
    label: "Blue Neon",
    style: "Futuristic",
    styleName: "Futuristic",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/blue-neon.jpg",
    prompt: "Futuristic studio portrait. Subject with sleek dark hair worn back, wearing a black fitted turtleneck. Face dramatically lit with cool electric blue neon light from one side, creating a striking split-light effect against a soft lavender-grey background. Minimal makeup, clean dewy skin, serene direct expression. Sci-fi editorial aesthetic, cinematic quality, 4K."
  },
  {
    id: "39",
    emoji: "\u2728",
    label: "Afro Glow",
    style: "Artistic",
    styleName: "Artistic",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/afro-glow.jpg",
    prompt: "Artistic beauty portrait. Subject with a voluminous natural afro halo, glowing deep skin, soft golden highlights. Dreamy pink-peach pastel background with soft atmospheric mist at the base. Bare shoulders, no jewellery, natural luminous skin with a subtle sheen. Gazing slightly upward with a contemplative expression. Fine art beauty photography, cinematic, 4K."
  },
  {
    id: "32",
    emoji: "\u{1F33A}",
    label: "Maldives Lunch",
    style: "Luxury",
    styleName: "Luxury",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/maldives-lunch.jpg",
    prompt: "Luxury resort lifestyle photo. Subject seated at an outdoor beachside restaurant table with a plate of fresh sushi, turquoise Maldives ocean and palm trees in the background. Wearing a sleek black swimsuit top and white linen skirt. Warm tropical sunlight, natural glowing skin, effortless beauty. Shot on a bright sunny day with crystal clear water behind. Editorial travel photography, cinematic, 4K."
  },
  {
    id: "33",
    emoji: "\u{1FAA9}",
    label: "Pearl Glow",
    style: "Editorial",
    styleName: "Editorial",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/pearl-glow.jpg",
    prompt: "Elegant editorial portrait. Subject wearing a classic white off-shoulder blouse with layered pearl and gold chain necklaces and a delicate bracelet. Hair loosely pinned up with soft strands falling across the face. Clean light grey studio background, soft diffused lighting that emphasizes skin texture and natural beauty. Intimate, timeless, luxury jewelry campaign aesthetic. High fashion photography, 4K, film grain."
  },
  {
    id: "34",
    emoji: "\u{1F338}",
    label: "Flower Field",
    style: "Romantic",
    styleName: "Romantic",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/flower-field.jpg",
    prompt: "Dreamy romantic portrait of a person lying in a lush green flower field surrounded by blooming pink daisies. Wearing a pink floral ruffled sundress. Flowers tucked into hair, flower-shaped earrings. Close-up face shot looking directly into camera with soft natural expression. Warm golden sunlight filtering through greenery. Soft bokeh background, freckled dewy skin, vibrant yet tender mood. Editorial nature photography, 4K, cinematic."
  },
  // ── K-Drama (3) ──────────────────────────────────────────────────────────────
  {
    id: "40",
    emoji: "\u{1F327}\uFE0F",
    label: "Seoul Rain",
    style: "K-Drama",
    styleName: "K-Drama",
    cat: "kdrama",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/kdrama-rain.jpg",
    prompt: "Cinematic Korean drama scene. Standing on a quiet Seoul street at night in the rain holding a transparent bubble umbrella, pastel trench coat, warm neon CU convenience store signs in Korean glowing behind. Wet pavement reflections, cinematic warm-cool color grade, K-drama lead energy, 4K."
  },
  {
    id: "41",
    emoji: "\u{1F338}",
    label: "School Romance",
    style: "K-Drama",
    styleName: "K-Drama",
    cat: "kdrama",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/kdrama-uniform.jpg",
    prompt: "Korean high school drama aesthetic. Sitting by a large classroom window in a Korean school uniform \u2014 white shirt, navy blazer, plaid skirt. Cherry blossom petals float past the open window. Resting chin on hand, dreamy expression. Warm golden afternoon light, clean pastel tones, K-drama school romance, 4K."
  },
  {
    id: "42",
    emoji: "\u{1F3EE}",
    label: "Hanok Night",
    style: "K-Drama",
    styleName: "K-Drama",
    cat: "kdrama",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/kdrama-hanok.jpg",
    prompt: "Period Korean drama romantic scene. Traditional pink silk hanbok with gold embroidery, standing in a wooden hanok courtyard with paper lanterns and plum blossom trees in full bloom. Gentle evening light, floating petals, dramatic yet delicate atmosphere. Historical K-drama romance, cinematic 4K."
  },
  // ── Anime (1 — others generated via admin panel) ─────────────────────────────
  {
    id: "44",
    emoji: "\u2B50",
    label: "Magical Girl",
    style: "Anime",
    styleName: "Anime",
    cat: "anime",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/anime-magical.jpg",
    prompt: "Real-life magical girl cosplay editorial. Stunning pink and lavender pleated skirt outfit, white gloves, star accessories, holding a glowing star wand. Pastel blue and pink swirling background with hanging star lights. Photorealistic professional photography, cinematic lighting, 4K."
  },
  // ── Fantasy (3) ──────────────────────────────────────────────────────────────
  {
    id: "46",
    emoji: "\u{1F9DD}",
    label: "Forest Elf",
    style: "Fantasy",
    styleName: "Fantasy",
    cat: "fantasy",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/fantasy-elf.jpg",
    prompt: "High fantasy elven portrait. Silver-blonde hair and pointed ears, intricate flowing emerald green gown with leaf-and-vine embroidery. Enchanted ancient forest with glowing fireflies and bioluminescent flowers behind. Regal posture, intense intelligent eyes. LOTR-level fantasy cinematics, 8K detail."
  },
  {
    id: "47",
    emoji: "\u{1F52E}",
    label: "Dark Witch",
    style: "Fantasy",
    styleName: "Fantasy",
    cat: "fantasy",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/fantasy-witch.jpg",
    prompt: "Dark fantasy witch portrait. Black wavy hair, dramatic black velvet cloak with moon and star embroidery, holding a glowing crystal ball. Mystical tower library with floating candles, ancient spell books and purple magical smoke. Deep violet and gold tones, cinematic dark fantasy, 4K."
  },
  {
    id: "48",
    emoji: "\u{1F3F0}",
    label: "Castle Princess",
    style: "Fantasy",
    styleName: "Fantasy",
    cat: "fantasy",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/fantasy-princess.jpg",
    prompt: "Fairy tale princess on a magical castle balcony at twilight. Ethereal white tulle ball gown with silver embroidery and tiny crystals. Stars and moonlight behind, glowing fireflies around the dress, flowering vines on stone railing. Disney princess meets editorial photography, whimsical, 4K."
  },
  // ── Vintage (3) ──────────────────────────────────────────────────────────────
  {
    id: "49",
    emoji: "\u{1FAA9}",
    label: "70s Soul",
    style: "Vintage",
    styleName: "Vintage",
    cat: "vintage",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/vintage-70s.jpg",
    prompt: "1970s fashion portrait. Natural afro hairstyle, bold rust-orange wide-collar blouse, high-waist flared denim jeans, platform heels, hands on hips. Retro living room with yellow-orange geometric wallpaper, lava lamp, vintage record player on a wooden sideboard. Kodachrome film aesthetic, 4K."
  },
  {
    id: "50",
    emoji: "\u{1F950}",
    label: "Paris 60s",
    style: "Vintage",
    styleName: "Vintage",
    cat: "vintage",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/vintage-paris.jpg",
    prompt: "1960s French New Wave cinema aesthetic. Short chic bob haircut, striped Breton top, high-waist wide-leg trousers, sitting at a Parisian sidewalk caf\xE9 table with espresso. Cobblestone street, classic French cars behind. Black and white film with warm sepia tint, Godard film aesthetic, 4K."
  },
  {
    id: "51",
    emoji: "\u{1F4FC}",
    label: "90s Hallway",
    style: "Vintage",
    styleName: "Vintage",
    cat: "vintage",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/vintage-90s.jpg",
    prompt: "90s nostalgia fashion. Straight-across bangs, butterfly hair clips, slip dress over white t-shirt, chunky platform sneakers. Leaning against a school locker covered in Nirvana and Spice Girls posters and polaroid photos. Warm overexposed film grain, vintage 90s color palette, nostalgic, 4K."
  },
  // Gossip Girl
  {
    id: "52",
    emoji: "\u{1F942}",
    label: "GG Penthouse",
    style: "Gossip Girl",
    styleName: "Gossip Girl",
    cat: "gossipgirl",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/gg-penthouse.jpg",
    prompt: "Glamorous Upper East Side NYC penthouse apartment. Floor-to-ceiling windows with Manhattan skyline at dusk behind. Velvet chaise lounge, silk slip dress, statement pearl jewelry, wine glass. Warm luxury interior, moody HBO drama cinematic lighting, 4K professional fashion photography."
  },
  {
    id: "53",
    emoji: "\u{1F45C}",
    label: "GG Met Steps",
    style: "Gossip Girl",
    styleName: "Gossip Girl",
    cat: "gossipgirl",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/gg-met-steps.jpg",
    prompt: "Preppy-chic fashion editorial on the iconic Metropolitan Museum steps in New York. Plaid blazer skirt set, knee-high leather boots, designer handbag, coffee cup, sunglasses. Fall leaves, NYC luxury editorial mood, cinematic color grade, professional photography, 4K."
  },
  // Couples
  {
    id: "54",
    emoji: "\u{1F3CD}\uFE0F",
    label: "Moto Couple",
    style: "Couple",
    styleName: "Couple",
    cat: "couple",
    isTrending: true,
    isNew: true,
    isPro: false,
    isCouple: true,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/couple-bike.jpg",
    prompt: "Cinematic couple portrait. Young man and woman on a vintage black motorcycle on a coastal road at golden hour. She wears a leather jacket, he wears a white tee. Both looking at camera, romantic chemistry, warm sunset light. Professional photography, 4K."
  },
  {
    id: "55",
    emoji: "\u{1F338}",
    label: "School Bench",
    style: "Couple",
    styleName: "Couple",
    cat: "couple",
    isTrending: true,
    isNew: true,
    isPro: false,
    isCouple: true,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/couple-bench.jpg",
    prompt: "Japanese school romance. Young man and woman sitting on a bench under cherry blossoms, wearing school uniforms \u2014 navy gakuran for him, white sailor fuku for her. Petals falling, golden light. Both looking at camera. Cinematic, professional photography, 4K."
  },
  {
    id: "56",
    emoji: "\u{1F917}",
    label: "City Hug",
    style: "Couple",
    styleName: "Couple",
    cat: "couple",
    isTrending: true,
    isNew: true,
    isPro: false,
    isCouple: true,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/couple-hug.jpg",
    prompt: "Romantic couple portrait. Woman hugging man from behind, arms around his shoulders, both smiling at camera. Hilltop at golden hour with glowing city skyline. Casual stylish outfits. Both faces clearly visible. Cinematic color grade, professional photography, 4K."
  },
  // Car meet
  {
    id: "57",
    emoji: "\u{1F697}",
    label: "JDM Sit",
    style: "Car Fit",
    styleName: "Car Fit",
    cat: "carfit",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/car-sit.jpg",
    prompt: "Young woman sitting on the ground in an underground parking garage, leaning against the front bumper of a lowered blue JDM Subaru sport car. White fitted tank top, baggy wide-leg dark blue jeans, black sneakers. Long straight dark hair, relaxed expression looking at camera. Moody dim parking garage fluorescent lighting. Dark blue teal color palette, film grain, underground car culture, 4K portrait."
  },
  {
    id: "58",
    emoji: "\u{1F3CE}\uFE0F",
    label: "Supercar Hood",
    style: "Car Fit",
    styleName: "Car Fit",
    cat: "carfit",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/car-hood.jpg",
    prompt: "Young woman leaning confidently on the hood of a matte dark gray McLaren supercar in a dimly lit underground parking lot at night. Tight black cropped baby tee, loose gray wide-leg cargo pants, hand resting on the car hood. Long dark wavy hair, striking eyes, subtle smirk. Dramatic low-key lighting, deep shadows, car headlights glowing softly. Dark moody color grade, film grain, underground car meet, 4K."
  },
  // Backrooms / Liminal Spaces
  {
    id: "59",
    emoji: "\u{1F7E1}",
    label: "Level 0",
    style: "Backrooms",
    styleName: "Backrooms",
    cat: "backrooms",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/backrooms-level0.jpg",
    prompt: "Young person standing alone in the iconic Backrooms Level 0 \u2014 infinite corridor of stained yellow wallpaper walls, damp beige carpet floor, endless flickering fluorescent ceiling panels. Casual hoodie and jeans. Uncanny liminal atmosphere, film grain, analog VHS texture, muted yellow-green tones, found-footage style, 4K portrait."
  },
  {
    id: "60",
    emoji: "\u{1F338}",
    label: "Flower Hall",
    style: "Backrooms",
    styleName: "Backrooms",
    cat: "backrooms",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/backrooms-flowers.jpg",
    prompt: "Young woman standing in an abandoned school hallway labeled Room 3-C, floor completely covered in blue and purple wildflowers growing indoors. White windows with curtains, blinding white light at the end of the corridor. White dress, calm expression. Dreamy surreal liminal atmosphere, soft overexposed lighting, film grain, photorealistic, 4K."
  },
  {
    id: "61",
    emoji: "\u{1F3EC}",
    label: "Pastel Mall",
    style: "Backrooms",
    styleName: "Backrooms",
    cat: "backrooms",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/backrooms-mall.jpg",
    prompt: "Young woman standing in a surreal empty retro 90s mall \u2014 arched pink ceramic ceiling, tall blue columns, colorful pastel checkerboard floor tiles, fluorescent dome ceiling lights. Mall stretches endlessly through arches. Y2K outfit, black crop tee, wide-leg jeans. Uncanny valley empty mall, liminal space, analog grain, photorealistic, 4K."
  },
  {
    id: "62",
    emoji: "\u{1F3D8}\uFE0F",
    label: "Infinite Suburb",
    style: "Backrooms",
    styleName: "Backrooms",
    cat: "backrooms",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/backrooms-suburb.jpg",
    prompt: "Young person standing in the middle of an endless suburban street lined with identical colorful pastel houses \u2014 red, pink, green, yellow, blue siding \u2014 stretching to the horizon. Perfectly manicured lawns, no people. Deep blue cloudless sky. Uncanny too-perfect empty neighborhood. Liminal space, digital film grain, photorealistic, 4K."
  }
];
function isFirebaseUnconfigured(e) {
  return e instanceof Error && e.message.includes("Firebase Admin credentials not configured");
}
router3.get("/", async (req, res, next) => {
  try {
    const { cat, limit: limitStr } = req.query;
    const limit = Math.min(Number(limitStr) || 50, 100);
    let query = db.collection("templates").orderBy("createdAt", "desc").limit(limit);
    if (typeof cat === "string" && cat !== "all") {
      if (cat === "trending") {
        query = db.collection("templates").where("isTrending", "==", true).orderBy("createdAt", "desc").limit(limit);
      } else {
        query = db.collection("templates").where("cat", "==", cat).orderBy("createdAt", "desc").limit(limit);
      }
    }
    const snap = await query.get();
    const firestoreTemplates = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((t) => t["status"] !== "pending" && t["status"] !== "rejected");
    let hiddenIds = [];
    try {
      const hiddenSnap = await db.collection("hiddenTemplates").doc("static").get();
      hiddenIds = hiddenSnap.data()?.["ids"] ?? [];
    } catch {
    }
    const firestoreIds = new Set(firestoreTemplates.map((t) => t.id));
    let statics = STATIC_TEMPLATES.filter((t) => !firestoreIds.has(t.id) && !hiddenIds.includes(t.id));
    if (typeof cat === "string" && cat !== "all") {
      if (cat === "trending") {
        statics = statics.filter((t) => t.isTrending);
      } else {
        statics = statics.filter((t) => t.cat === cat);
      }
    }
    return res.json({ templates: [...firestoreTemplates, ...statics] });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      let templates = STATIC_TEMPLATES;
      const { cat } = req.query;
      if (typeof cat === "string" && cat !== "all") {
        if (cat === "trending") {
          templates = STATIC_TEMPLATES.filter((t) => t.isTrending);
        } else {
          templates = STATIC_TEMPLATES.filter((t) => t.cat === cat);
        }
      }
      return res.json({ templates });
    }
    return next(e);
  }
});
router3.get("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection("templates").doc(req.params.id).get();
    if (!snap.exists) return next(new NotFoundError("Template"));
    res.json({ template: { id: snap.id, ...snap.data() } });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      const template = STATIC_TEMPLATES.find((t) => t.id === req.params.id);
      if (!template) return next(new NotFoundError("Template"));
      return res.json({ template });
    }
    next(e);
  }
});
var templates_default = router3;

// apps/api/src/routes/billing.ts
var import_express5 = require("express");

// apps/api/src/middleware/rateLimit.ts
var store = /* @__PURE__ */ new Map();
function rateLimit(maxPerMinute) {
  return (req, _res, next) => {
    const key = req.uid ?? (req.ip ?? "unknown");
    const now = Date.now();
    const entry = store.get(key) ?? { count: 0, resetAt: now + 6e4 };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 6e4;
    }
    entry.count++;
    store.set(key, entry);
    if (entry.count > maxPerMinute) {
      return next(new RateLimitError());
    }
    next();
  };
}

// apps/api/src/lib/polar.ts
var import_sdk = require("@polar-sh/sdk");
var _polar;
function getPolar() {
  if (_polar) return _polar;
  _polar = new import_sdk.Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"],
    server: process.env["POLAR_SERVER"] ?? "sandbox"
  });
  return _polar;
}

// apps/api/src/services/polarService.ts
async function createCheckoutSession(productId, successUrl, customerEmail) {
  const polar = getPolar();
  const checkout = await polar.checkouts.create({
    productId,
    successUrl,
    customerEmail
  });
  return checkout.url;
}
async function createCustomerPortalSession(customerId) {
  const polar = getPolar();
  const session = await polar.customerSessions.create({ customerId });
  return session.customerPortalUrl;
}

// apps/api/src/routes/billing.ts
var router4 = (0, import_express5.Router)();
router4.post("/checkout", ensureAuth, rateLimit(5), async (req, res, next) => {
  try {
    const parsed = CheckoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { planId } = parsed.data;
    const productId = getProductIdByPlan(planId);
    if (!productId) {
      return next(new ValidationError("Invalid plan"));
    }
    const authUser = await adminAuth.getUser(req.uid);
    const successUrl = `${process.env["APP_BASE_URL"]}/billing/success?plan=${planId}`;
    const checkoutUrl = await createCheckoutSession(
      productId,
      successUrl,
      authUser.email
    );
    res.json({ checkoutUrl });
  } catch (e) {
    next(e);
  }
});
router4.post("/portal", ensureAuth, async (req, res, next) => {
  try {
    const snap = await db.collection("users").doc(req.uid).get();
    const polarCustomerId = snap.data()?.["polarCustomerId"];
    if (!polarCustomerId) {
      return next(new AppError("NO_BILLING_ACCOUNT", "No billing account found", 400));
    }
    const portalUrl = await createCustomerPortalSession(polarCustomerId);
    res.json({ portalUrl });
  } catch (e) {
    next(e);
  }
});
var billing_default = router4;

// apps/api/src/routes/generate.ts
var import_express6 = require("express");
var import_firestore2 = require("firebase-admin/firestore");

// apps/api/src/middleware/quota.ts
var OWNER_EMAIL = "araiakhylbek78@gmail.com";
async function checkQuota(req, _res, next) {
  try {
    const userRef = db.collection("users").doc(req.uid);
    const allowed = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new NotFoundError("User");
      const user = snap.data();
      if (user["email"]?.toLowerCase() === OWNER_EMAIL) {
        return true;
      }
      const tier = user["tier"] ?? "free";
      const plan = PLANS[tier] ?? PLANS.free;
      if (plan.monthlyLimit === Infinity) return true;
      const used = user["generationsUsed"] ?? 0;
      if (used >= plan.monthlyLimit) return false;
      t.update(userRef, {
        generationsUsed: used + 1,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return true;
    });
    if (!allowed) return next(new QuotaExceededError());
    next();
  } catch (e) {
    next(e);
  }
}

// apps/api/src/ai/GeminiProvider.ts
async function geminiPost(endpoint, body) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new AppError("MISSING_CONFIG", "GEMINI_API_KEY not configured", 500);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55e3)
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AppError("GEMINI_ERROR", `Gemini API error ${res.status}: ${detail}`, 502);
  }
  return res.json();
}
var GeminiProvider = class {
  async generateTemplateConcept(trend) {
    const contextHint = trend.trendContext ? `
Context: ${trend.trendContext}` : "";
    const keywordsHint = trend.keywords?.length > 0 ? `
Related hashtags: ${trend.keywords.join(", ")}` : "";
    const prompt = `You are a creative director for a viral photo app. Create an AI photo template concept.

Trend: "${trend.topic}" (${trend.category})${contextHint}${keywordsHint}

The template will be used so users can insert their face/photo into a generated scene. Design it to be:
- Highly shareable on TikTok/Instagram
- Photorealistic, cinematic quality
- Have a clear aesthetic identity

Return ONLY valid JSON with these fields:
{
  "emoji": "single relevant emoji",
  "label": "catchy 2-3 word name",
  "style": "style descriptor (1-2 words, e.g. Cinematic, Ethereal, Editorial)",
  "cat": "one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban",
  "prompt": "detailed image generation prompt (100-150 words): describe the full scene, lighting, colors, mood, camera angle, background details. Include 'face placeholder area' or 'portrait position' for where the user's face will go. Optimized for Gemini image generation."
}`;
    const result = await geminiPost("gemini-2.5-flash:generateContent", {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
    });
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError("GEMINI_PARSE_ERROR", `No JSON in concept response: ${cleaned.slice(0, 300)}`, 502);
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new AppError("GEMINI_PARSE_ERROR", `Invalid concept JSON: ${jsonMatch[0].slice(0, 200)}`, 502);
    }
    return {
      emoji: parsed.emoji ?? "\u2728",
      label: parsed.label ?? trend.topic,
      style: parsed.style ?? "Aesthetic",
      cat: parsed.cat ?? "aesthetic",
      prompt: parsed.prompt ?? ""
    };
  }
  // Generates a template preview image (no user face)
  async generateTemplateImage(concept) {
    const result = await geminiPost(
      "gemini-2.5-flash-image:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `Create a stunning, photorealistic template preview image for social media.

Style: ${concept.style} | Category: ${concept.cat}
Label: ${concept.label} ${concept.emoji}

Image generation prompt:
${concept.prompt}

Requirements:
- Photorealistic, professional photography quality
- Cinematic lighting and composition
- Leave a natural portrait/face area visible in the foreground
- Do NOT include a real human face, show the scene empty or with a silhouette placeholder
- Ultra high quality, 4K detail`
              }
            ]
          }
        ],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      }
    );
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError("GEMINI_NO_IMAGE", "No image returned from Gemini", 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
  // Generates a styled template image (with a person, no user face) for face-swap
  async generateTemplateOnly(prompt) {
    const result = await geminiPost("gemini-2.5-flash-image:generateContent", {
      contents: [{
        parts: [{
          text: `Generate a photorealistic styled portrait photo of a person:

${prompt}

Requirements:
- A person must be clearly visible with a well-lit face
- Professional photography, cinematic quality
- The face should be prominent in the frame
- Photorealistic, high detail`
        }]
      }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
    });
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError("GEMINI_NO_IMAGE", "No template image returned from Gemini", 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
  // Photo retouching after face-swap: improves realism/quality without touching faces.
  async enhanceImage(imageBase64) {
    const data = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const result = await geminiPost("gemini-2.5-flash-image:generateContent", {
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data } },
          {
            text: `You are a professional photo retoucher. This image has a face-swap applied to it \u2014 the face is already correct and must not be touched.

TASK: Apply post-processing to make the image look more realistic and high quality. Think of this as Lightroom/Photoshop retouching, not image generation.

WHAT TO IMPROVE:
- Blend the face edges into the background more naturally (fix face-swap seams)
- Match the color temperature and lighting of the face to the scene lighting
- Reduce any "AI look" \u2014 make skin texture, hair, and clothing look like a real photo
- Sharpen details, reduce noise, improve dynamic range
- Apply subtle cinematic color grading that matches the scene mood

ABSOLUTE RULES \u2014 DO NOT VIOLATE:
- Do NOT change the face features, shape, or identity \u2014 the face is already correct
- Do NOT change the hairstyle, hair color, or hair length
- Do NOT alter the body, clothing, or pose
- Do NOT move, replace, or modify the background
- Do NOT regenerate or reimagine anything \u2014 only retouch what is there

Output: the same photo, retouched to look like a professional cinematic photograph.`
          }
        ]
      }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
    });
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return imageBase64;
    }
    const { mimeType, data: outData } = imagePart.inlineData;
    return `data:${mimeType};base64,${outData}`;
  }
  async personalizeImage(faceSwappedBase64, templatePrompt, _userPhotoBase64) {
    const swappedData = faceSwappedBase64.replace(/^data:[^;]+;base64,/, "");
    const POSES = [
      "body turned 3/4 to the left, face looking back over the left shoulder toward the camera, confident gaze",
      "body turned 3/4 to the right, chin slightly raised, eyes directed straight at camera with a soft expression",
      "slight side profile facing right, face angled toward camera, hair falling naturally to one side",
      "facing camera directly, one hand lightly touching hair, relaxed candid expression",
      "body angled left, weight on back foot, eyes looking at camera with a calm confident look",
      "leaning slightly forward toward camera, intimate close framing, direct eye contact",
      "low angle shot looking slightly upward at subject, subject looking down at camera with calm expression",
      "body turned away slightly, glancing back at camera over the shoulder with a natural expression"
    ];
    const pose = POSES[Math.floor(Math.random() * POSES.length)];
    const parts = [];
    parts.push({ inlineData: { mimeType: "image/jpeg", data: swappedData } });
    parts.push({
      text: `You are given a portrait photo where a person's face has been placed into a styled scene.

YOUR TASK: Recreate this as a new high-quality editorial portrait \u2014 same person, same scene style, but with a COMPLETELY DIFFERENT pose and camera angle.

\u2501\u2501\u2501 FACE IDENTITY (most important) \u2501\u2501\u2501
\u2022 Reproduce this exact person's face: same skin tone, eye shape, nose, lips, jawline, bone structure
\u2022 Keep same hair color, length, and texture from the input
\u2022 The person must be 100% recognizable as the same individual

\u2501\u2501\u2501 REQUIRED POSE \u2014 YOU MUST USE THIS EXACTLY \u2501\u2501\u2501
\u2192 ${pose}
\u2022 The pose in the input photo must NOT be copied \u2014 use the new pose above
\u2022 This is mandatory, not optional

\u2501\u2501\u2501 SCENE & QUALITY \u2501\u2501\u2501
\u2022 Same background, setting, atmosphere, outfit style, and lighting mood as the input
\u2022 Fix any face-swap blending seams, match face lighting to scene
\u2022 Photorealistic skin, cinematic color grade, 4K quality

Scene: ${templatePrompt}

Output: one portrait. New pose. Same person. Same scene.`
    });
    const result = await geminiPost("gemini-2.5-flash-image:generateContent", {
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
    });
    const responseParts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return this.enhanceImage(faceSwappedBase64);
    }
    const { mimeType, data: outData } = imagePart.inlineData;
    return `data:${mimeType};base64,${outData}`;
  }
  // Generates a personalized image using both the template image and the user's face photo
  async generateUserImage(templatePrompt, userImageBase64, templateImageBase64) {
    const parts = [];
    if (userImageBase64 && templateImageBase64) {
      const templateMime = templateImageBase64.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg";
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: userImageBase64.replace(/^data:[^;]+;base64,/, "")
        }
      });
      parts.push({
        inlineData: {
          mimeType: templateMime,
          data: templateImageBase64.replace(/^data:[^;]+;base64,/, "")
        }
      });
      parts.push({
        text: `You have two images.
Image 1: a selfie of a real person (their face, skin tone, eye shape, hair).
Image 2: a styled photo template (background, outfit, lighting, pose, scene).

Generate a single photorealistic portrait of the SAME PERSON from Image 1 placed into the SCENE from Image 2.

Rules:
- Face: reproduce the person's face from Image 1 as closely as possible \u2014 same eye shape, skin tone, facial bone structure, hair color and texture
- Scene: use the background, lighting, color palette, outfit and pose from Image 2
- The result must look like a real professional photo of that specific person in that setting
- Do NOT generate a random or generic face
- Photorealistic, cinematic, editorial quality

Scene: ${templatePrompt}`
      });
    } else if (userImageBase64) {
      const base64Data = userImageBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
      parts.push({
        text: `You have the user's photo above. Apply this visual style template to them:

${templatePrompt}

Instructions:
- Preserve the person's facial features, skin tone, and likeness
- Apply the template's background, lighting, color grade, and artistic style
- Blend the person naturally into the scene
- Output a high-quality, photorealistic, portrait-format image
- Make it look like a professional styled photo shoot`
      });
    } else {
      parts.push({
        text: `Generate a high-quality, photorealistic styled portrait image:

${templatePrompt}

Create a beautiful, magazine-quality photo that would go viral on TikTok and Instagram.
Portrait orientation, cinematic lighting, ultra-detailed.`
      });
    }
    const result = await geminiPost(
      "gemini-2.5-flash-image:generateContent",
      {
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      }
    );
    const responseParts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError("GEMINI_NO_IMAGE", "No image returned from Gemini", 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
};

// apps/api/src/services/replicateService.ts
var import_replicate = __toESM(require_replicate());
var FACE_SWAP_VERSION = "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111";
function getClient() {
  const token = process.env["REPLICATE_API_TOKEN"];
  if (!token) throw new AppError("MISSING_CONFIG", "REPLICATE_API_TOKEN not configured", 500);
  return new import_replicate.default({ auth: token });
}
function dataUriToBlob(dataUri) {
  const [header, data] = dataUri.split(",");
  const mimeType = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(data ?? "", "base64");
  return new Blob([bytes], { type: mimeType });
}
async function toReplicateUrl(replicate, input) {
  if (input.startsWith("http")) return input;
  const dataUri = input.startsWith("data:") ? input : `data:image/jpeg;base64,${input}`;
  const file = await replicate.files.create(dataUriToBlob(dataUri), { filename: "image.jpg" });
  return file.urls.get;
}
async function fetchResultAsBase64(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(6e4) });
  if (!response.ok) throw new AppError("REPLICATE_FETCH", `Failed to fetch result: ${response.status}`, 502);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
}
async function faceSwap(templateInput, userPhotoBase64) {
  const replicate = getClient();
  const [templateUrl, userUrl] = await Promise.all([
    toReplicateUrl(replicate, templateInput),
    toReplicateUrl(replicate, `data:image/jpeg;base64,${userPhotoBase64}`)
  ]);
  const output = await replicate.run(FACE_SWAP_VERSION, {
    input: { input_image: templateUrl, swap_image: userUrl }
  });
  const resultUrl = typeof output === "string" ? output : output.url().href;
  return fetchResultAsBase64(resultUrl);
}

// apps/api/src/routes/generate.ts
var router5 = (0, import_express6.Router)();
router5.post("/", ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, imageBase64_2, templateBase64, templateId, templateImageSrc } = parsed.data;
    const appBaseUrl = process.env["APP_BASE_URL"] ?? "https://mytrendy.app";
    let imageDataUri;
    if (imageBase64) {
      let templateInput = templateBase64;
      if (!templateInput) {
        if (templateImageSrc?.startsWith("data:")) {
          templateInput = templateImageSrc;
        } else if (templateImageSrc) {
          templateInput = templateImageSrc.startsWith("http") ? templateImageSrc : `${appBaseUrl}${templateImageSrc}`;
        } else if (templateId) {
          const snap = await db.collection("templates").doc(templateId).get();
          templateInput = snap.data()?.["image"] ?? void 0;
        }
      }
      if (!templateInput) throw new AppError("NO_TEMPLATE", "Could not resolve template image", 400);
      const swapped1 = await faceSwap(templateInput, imageBase64);
      const swapped = imageBase64_2 ? await faceSwap(swapped1, imageBase64_2) : swapped1;
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.personalizeImage(swapped, prompt);
    } else {
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, void 0, void 0);
    }
    res.json({ image: imageDataUri, prompt });
  } catch (e) {
    try {
      await db.collection("users").doc(req.uid).update({
        generationsUsed: import_firestore2.FieldValue.increment(-1),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch {
    }
    next(e);
  }
});
var generate_default = router5;

// apps/api/src/routes/generateTemplate.ts
var import_express7 = require("express");
var ADMIN_EMAIL = "araiakhylbek78@gmail.com";
var THEMES = [
  "stadium cam",
  "magazine cover",
  "fashion doll",
  "golden hour portrait",
  "caf\xE9 scene",
  "airport lounge",
  "rooftop party",
  "beach sunset",
  "ski resort",
  "red carpet",
  "concert VIP",
  "flower field",
  "rainy day aesthetic",
  "bookstore cozy",
  "gym mirror selfie"
];
var router6 = (0, import_express7.Router)();
router6.post("/", ensureAuth, async (req, res, next) => {
  try {
    const userRecord = await adminAuth.getUser(req.uid);
    if (userRecord.email !== ADMIN_EMAIL) {
      return next(new AppError("FORBIDDEN", "Admin only", 403));
    }
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const gemini = new GeminiProvider();
    const concept = await gemini.generateTemplateConcept({
      topic: theme,
      category: "aesthetic",
      keywords: [],
      score: 1,
      source: "admin",
      trendContext: `Create a photorealistic template for "${theme}" theme. The image should have a clearly visible face area for future face swapping. Viral TikTok aesthetic, 4K quality, professional photography.`
    });
    const imageDataUri = await gemini.generateTemplateImage(concept);
    const templateData = {
      emoji: concept.emoji,
      label: concept.label,
      style: concept.style,
      styleName: concept.style,
      cat: concept.cat,
      isTrending: true,
      isNew: true,
      isPro: false,
      likes: 0,
      uses: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      image: imageDataUri,
      prompt: concept.prompt
    };
    const docRef = await db.collection("templates").add(templateData);
    res.json({ template: { id: docRef.id, ...templateData } });
  } catch (e) {
    next(e);
  }
});
var generateTemplate_default = router6;

// apps/api/src/routes/cron.ts
var import_express8 = require("express");

// apps/api/src/ai/TikTokTrendSource.ts
async function fetchTikTokTrends() {
  try {
    const url = "https://ads.tiktok.com/business/creativecenter/api/v1/trending_hashtags/list?" + new URLSearchParams({
      period: "7",
      country_code: "US",
      page_size: "20"
    });
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Referer: "https://ads.tiktok.com/business/creativecenter/inspiration/trending/hashtag/pc/en",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "TikTok Creative Center returned non-200");
      return [];
    }
    const json = await res.json();
    const list = json?.data?.list ?? [];
    return list.map((item, i) => ({
      name: (item.hashtag_name ?? "").replace(/^#/, ""),
      type: "hashtag",
      score: Math.max(1, 10 - i),
      source: "tiktok"
    })).filter((t) => t.name.length > 0).slice(0, 15);
  } catch (e) {
    logger.warn({ err: e }, "TikTok trend fetch failed");
    return [];
  }
}

// apps/api/src/ai/PinterestTrendSource.ts
var SEED_QUERIES = ["aesthetic", "outfit", "vintage", "dreamy", "editorial"];
async function fetchPinterestTrends() {
  const results = [];
  for (const seed of SEED_QUERIES) {
    try {
      const url = `https://www.pinterest.com/resource/SearchBarResource/get/?` + new URLSearchParams({
        source_url: "/",
        data: JSON.stringify({
          options: { q: seed, article: "pin", corpus: "pins", followed_only: false, bookmarks: [] },
          context: {}
        }),
        _: String(Date.now())
      });
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          "X-Pinterest-AppState": "active",
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(6e3)
      });
      if (!res.ok) continue;
      const json = await res.json();
      const items = json?.resource_response?.data ?? json?.resource_response?.items ?? [];
      for (const item of items.slice(0, 4)) {
        const name = item.display_name ?? item.term ?? item.query ?? "";
        if (name) {
          results.push({ name, type: "keyword", score: 6, source: "pinterest" });
        }
      }
    } catch (e) {
      logger.warn({ err: e, seed }, "Pinterest trend fetch failed for seed");
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return results.filter((t) => {
    const key = t.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// apps/api/src/ai/GeminiTrendSource.ts
async function geminiGroundedSearch(prompt) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new AppError("MISSING_CONFIG", "GEMINI_API_KEY not configured", 500);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new AppError("GEMINI_ERROR", `Gemini grounded search error ${res.status}: ${err}`, 502);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
var FALLBACK_TRENDS = [
  { topic: "Dark Academia Library", category: "aesthetic", keywords: ["darkacademia", "aesthetic", "vintage", "moody"], score: 9, source: "google" },
  { topic: "Y2K Fashion Doll", category: "fashion", keywords: ["y2k", "fashiondoll", "barbie", "aesthetic"], score: 9, source: "google" },
  { topic: "Cinematic KDrama Lead", category: "kdrama", keywords: ["kdrama", "cinematic", "korean", "aesthetic"], score: 8, source: "google" },
  { topic: "Golden Hour Portrait", category: "nature", keywords: ["goldenhour", "portrait", "sunset", "glow"], score: 8, source: "google" },
  { topic: "Soft Cottagecore Morning", category: "aesthetic", keywords: ["cottagecore", "softgirl", "morning", "cozy"], score: 7, source: "google" },
  { topic: "Editorial Vogue Cover", category: "fashion", keywords: ["editorial", "vogue", "magazine", "fashion"], score: 7, source: "google" }
];
var GeminiTrendSource = class {
  async getTrendingTopics() {
    try {
      return await this._fetchFromGemini();
    } catch (e) {
      logger.warn({ err: e }, "Gemini trend fetch failed, using fallback trends");
      return FALLBACK_TRENDS;
    }
  }
  async _fetchFromGemini() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const [tikTokRaw, pinterestRaw] = await Promise.all([
      fetchTikTokTrends().catch(() => []),
      fetchPinterestTrends().catch(() => [])
    ]);
    logger.info(
      { tikTokCount: tikTokRaw.length, pinterestCount: pinterestRaw.length },
      "Scraped raw trends"
    );
    const rawSignals = [
      ...tikTokRaw.slice(0, 10).map((t) => `TikTok: #${t.name}`),
      ...pinterestRaw.slice(0, 8).map((t) => `Pinterest: "${t.name}"`)
    ].join("\n");
    const prompt = `Today is ${today}. You are a visual trend analyst for a photo editing app.

${rawSignals.length > 0 ? `Here are signals from real platforms scraped right now:
${rawSignals}

` : ""}Use Google Search to find what visual aesthetics, photo styles, and fashion trends are viral TODAY on TikTok and Pinterest.

Generate 8 distinct AI photo template ideas based on what's actually trending. Each template should:
- Be a visual aesthetic people want to recreate in photos of themselves
- Be inspired by real viral TikTok/Pinterest content today
- Have a unique, scroll-stopping style

Return a JSON array (no markdown) where each object has:
- topic: specific trend name (3-5 words, e.g. "Dark Academia Library Look", "Soft Cottagecore Picnic")
- category: one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban
- keywords: array of 4 TikTok/Pinterest hashtags without # symbol
- score: relevance score 1-10 (10 = most viral right now)
- source: "tiktok" | "pinterest" | "google"
- trendContext: one sentence describing WHY this is trending right now

Return ONLY the JSON array.`;
    let text = "";
    try {
      text = await geminiGroundedSearch(prompt);
    } catch (e) {
      logger.warn({ err: e }, "Gemini grounded search failed, falling back to ungrounded");
      const apiKey = process.env["GEMINI_API_KEY"];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
          })
        }
      );
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new AppError(
        "GEMINI_PARSE_ERROR",
        `Failed to parse Gemini trends response. Got: ${cleaned.slice(0, 200)}`,
        502
      );
    }
    let trends;
    try {
      trends = JSON.parse(jsonMatch[0]);
    } catch {
      throw new AppError("GEMINI_PARSE_ERROR", `Invalid JSON from Gemini: ${jsonMatch[0].slice(0, 200)}`, 502);
    }
    return trends.map((t) => ({
      topic: t.topic ?? "Trending Aesthetic",
      category: t.category ?? "aesthetic",
      keywords: Array.isArray(t.keywords) ? t.keywords : [],
      score: typeof t.score === "number" ? t.score : 5,
      source: t.source ?? "google",
      trendContext: t.trendContext
    })).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  // end _fetchFromGemini
};

// apps/api/src/routes/cron.ts
var router7 = (0, import_express8.Router)();
var TEMPLATES_PER_RUN = 3;
router7.post("/generate-daily", async (req, res) => {
  if (req.headers["authorization"] !== `Bearer ${process.env["CRON_SECRET"]}`) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } });
    return;
  }
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const runRef = db.collection("generationRuns").doc(date);
  const existing = await runRef.get();
  if (existing.exists && existing.data()?.["status"] === "completed") {
    res.json({ ok: true, skipped: true, date });
    return;
  }
  await runRef.set({
    date,
    status: "pending",
    templatesGenerated: 0,
    startedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ ok: true, date, status: "running" });
  runGeneration(date, runRef).catch((e) => {
    logger.error(e, "Daily generation crashed");
  });
});
async function runGeneration(date, runRef) {
  const trendSource = new GeminiTrendSource();
  const gemini = new GeminiProvider();
  let count = 0;
  const errors = [];
  try {
    logger.info({ date }, "Fetching trends from TikTok, Pinterest, and Gemini Search");
    const trends = await trendSource.getTrendingTopics();
    logger.info({ date, trendCount: trends.length }, "Got trends, generating templates");
    const topTrends = trends.slice(0, TEMPLATES_PER_RUN);
    for (const trend of topTrends) {
      try {
        logger.info({ topic: trend.topic, source: trend.source }, "Generating template");
        const concept = await gemini.generateTemplateConcept(trend);
        const imageDataUri = await gemini.generateTemplateImage(concept);
        await db.collection("templates").add({
          emoji: concept.emoji,
          label: concept.label,
          style: concept.style,
          cat: concept.cat,
          prompt: concept.prompt,
          image: imageDataUri,
          trendTopic: trend.topic,
          trendSource: trend.source,
          trendKeywords: trend.keywords,
          trendContext: trend.trendContext ?? null,
          isTrending: true,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          status: "pending",
          generatedDate: date,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        count++;
        logger.info({ topic: trend.topic, count }, "Template generated and saved");
      } catch (e) {
        const msg = `${trend.topic}: ${String(e)}`;
        errors.push(msg);
        logger.error(e, `Failed to generate template for trend: ${trend.topic}`);
      }
    }
    await runRef.update({
      status: "completed",
      templatesGenerated: count,
      errors: errors.length > 0 ? errors : null,
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info({ date, count, errors: errors.length }, "Daily generation completed");
  } catch (e) {
    logger.error(e, "Daily generation failed");
    await runRef.update({
      status: "failed",
      error: String(e),
      templatesGenerated: count
    });
  }
}
var cron_default = router7;

// apps/api/src/routes/admin.ts
var import_express9 = require("express");

// apps/api/src/middleware/ensureOwner.ts
var OWNER_EMAIL2 = "araiakhylbek78@gmail.com";
async function ensureOwner(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new UnauthorizedError("Missing token"));
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    if (decoded.email?.toLowerCase() !== OWNER_EMAIL2) {
      return next(new UnauthorizedError("Owner only"));
    }
    req.uid = decoded.uid;
    next();
  } catch {
    next(new UnauthorizedError("Invalid token"));
  }
}

// apps/api/src/routes/admin.ts
var router8 = (0, import_express9.Router)();
router8.use(ensureOwner);
async function uploadTemplateImage(buffer, label) {
  const bucket = adminStorage.bucket();
  const filename = `templates/${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
  const file = bucket.file(filename);
  await file.save(buffer, { contentType: "image/jpeg", metadata: { cacheControl: "public, max-age=31536000" } });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}
var STYLED_PROMPTS = [
  // K-Drama / Korean aesthetic
  {
    emoji: "\u{1F327}\uFE0F",
    label: "Seoul Rain",
    style: "K-Drama",
    cat: "kdrama",
    prompt: "Cinematic photorealistic portrait. Real woman standing on a quiet Seoul street at night in the rain, holding a transparent bubble umbrella, wearing a soft pastel pink trench coat. CU convenience store neon signs glowing in Korean behind her. Wet cobblestone pavement reflections. Warm-cool cinematic color grade. Professional photography, 4K."
  },
  {
    emoji: "\u{1F338}",
    label: "Cherry Blossom",
    style: "K-Drama",
    cat: "kdrama",
    prompt: "Photorealistic K-drama portrait. Young woman in a Korean high school uniform \u2014 navy blazer, plaid skirt, red bow tie \u2014 sitting at a classroom desk by a large open window with cherry blossoms drifting in. Soft golden afternoon light. Clean, dreamy, professional photography, 4K cinematic."
  },
  {
    emoji: "\u2615",
    label: "Caf\xE9 Seoul",
    style: "K-Drama",
    cat: "kdrama",
    prompt: "Photorealistic editorial portrait. Elegant woman in a modern Seoul caf\xE9, wearing a camel wool coat, holding a ceramic coffee cup, looking out a rain-streaked window. Warm amber caf\xE9 interior lights, soft bokeh. Professional fashion photography, cinematic color grade, 4K."
  },
  // Trending TikTok aesthetics (2024-2025: coquette, dark academia, Y2K, editorial)
  {
    emoji: "\u{1F380}",
    label: "Coquette Bow",
    style: "Aesthetic",
    cat: "aesthetic",
    prompt: "Viral TikTok coquette aesthetic photorealistic portrait. Woman in a soft pink satin slip dress with large satin ribbon bow in hair, holding a bouquet of white roses. Soft pink and cream background with sheer curtain. Dreamy pastel tones, professional beauty photography, 4K."
  },
  {
    emoji: "\u{1F4DA}",
    label: "Dark Academia",
    style: "Aesthetic",
    cat: "aesthetic",
    prompt: "Dark academia aesthetic editorial portrait. Woman in a camel blazer, Oxford shirt, and plaid trousers, standing in an atmospheric old university library with towering bookshelves, wooden ladders, warm lamp light. Moody brown-green tones, dust motes in light beams. Photorealistic professional photography, 4K."
  },
  {
    emoji: "\u{1F4BF}",
    label: "Y2K Glam",
    style: "Aesthetic",
    cat: "aesthetic",
    prompt: "Y2K early 2000s nostalgia fashion editorial. Real woman in a silver iridescent halter top, low-rise flared jeans, chunky platform shoes, butterfly clips in hair. Fun colorful early-2000s background. Oversaturated warm pop colors, professional fashion photography, 4K."
  },
  // K-Drama / Hanok
  {
    emoji: "\u{1F3EE}",
    label: "Hanok Lanterns",
    style: "K-Drama",
    cat: "kdrama",
    prompt: "Photorealistic period K-drama portrait. Woman in a traditional Korean hanbok \u2014 pale blush silk with gold floral embroidery \u2014 standing alone in a wooden hanok courtyard at dusk. Paper lanterns glowing warmly around her, plum blossoms in the background. Real photography quality, cinematic 4K."
  },
  // Vintage (90s, 70s)
  {
    emoji: "\u{1F4FC}",
    label: "90s School",
    style: "Vintage",
    cat: "vintage",
    prompt: "Authentic 1990s American high school nostalgia portrait. Young woman with feathered bangs and butterfly clips, wearing a floral slip dress over white t-shirt, chunky sneakers. Leaning on a school locker with Spice Girls and Nirvana posters. Warm overexposed film grain, real photography aesthetic, 4K."
  },
  {
    emoji: "\u{1FAA9}",
    label: "70s Groovy",
    style: "Vintage",
    cat: "vintage",
    prompt: "Authentic 1970s fashion portrait. Confident woman with a full afro, wearing a rust-orange wide-collar printed blouse, high-waist flared trousers, platform shoes. Retro apartment with groovy geometric wallpaper and lava lamp. Warm Kodachrome film photography aesthetic, 4K."
  },
  {
    emoji: "\u{1F39E}\uFE0F",
    label: "Film Noir",
    style: "Vintage",
    cat: "vintage",
    prompt: "Photorealistic 1940s film noir portrait. Glamorous woman with victory rolls hairstyle, red lips, wearing a belted black trench coat, standing under a lamppost on a rainy cobblestone street at night. High-contrast shadows, black and white with slight sepia. Real photography quality, 4K."
  },
  // Trending: editorial & nature
  {
    emoji: "\u{1F33F}",
    label: "Cottagecore",
    style: "Aesthetic",
    cat: "aesthetic",
    prompt: "Cottagecore aesthetic editorial portrait. Woman in a vintage floral prairie dress with puffed sleeves, standing in a wildflower meadow at golden hour. Holding a wicker basket with flowers. Soft warm backlighting, bokeh flowers, earthy tones. Photorealistic, professional photography, 4K."
  },
  {
    emoji: "\u{1F319}",
    label: "Moonlit Night",
    style: "Aesthetic",
    cat: "aesthetic",
    prompt: "Dreamy moonlit night editorial portrait. Woman in a silver satin evening gown standing on a coastal cliff at night with a full moon over the ocean behind her. Moonlight illuminating her face and dress, silver and navy tones. Photorealistic cinematic photography, 4K."
  }
];
router8.get("/templates", async (req, res, next) => {
  try {
    const status = req.query["status"] || "pending";
    const includeStatic = req.query["includeStatic"] === "true";
    const snap = await db.collection("templates").orderBy("createdAt", "desc").limit(200).get();
    let firestoreTemplates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (status === "pending") {
      firestoreTemplates = firestoreTemplates.filter((t) => t["status"] === "pending");
    } else if (status === "published") {
      firestoreTemplates = firestoreTemplates.filter((t) => !t["status"] || t["status"] === "published");
    }
    const hiddenSnap = await db.collection("hiddenTemplates").doc("static").get();
    const hiddenIds = hiddenSnap.data()?.["ids"] ?? [];
    let templates = firestoreTemplates;
    if (includeStatic) {
      const staticTemplates = STATIC_TEMPLATES.filter((t) => !hiddenIds.includes(t.id)).map((t) => ({ ...t, _isStatic: true }));
      templates = [...staticTemplates, ...firestoreTemplates];
    }
    res.json({ templates, total: templates.length });
  } catch (e) {
    next(e);
  }
});
router8.patch("/templates/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["published", "pending", "rejected"].includes(status)) {
      throw new AppError("BAD_REQUEST", "Invalid status", 400);
    }
    await db.collection("templates").doc(id).update({ status });
    res.json({ ok: true, id, status });
  } catch (e) {
    next(e);
  }
});
router8.delete("/templates/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStatic = STATIC_TEMPLATES.some((t) => t.id === id);
    if (isStatic) {
      const hiddenRef = db.collection("hiddenTemplates").doc("static");
      const hiddenSnap = await hiddenRef.get();
      const current = hiddenSnap.data()?.["ids"] ?? [];
      if (!current.includes(id)) {
        await hiddenRef.set({ ids: [...current, id] }, { merge: true });
      }
    } else {
      await db.collection("templates").doc(id).delete();
    }
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
});
router8.post("/generate-styled", async (req, res, next) => {
  try {
    const count = Math.min(Number(req.query["count"]) || 3, 6);
    const gemini = new GeminiProvider();
    const offset = Math.floor(Date.now() / 6e4) % STYLED_PROMPTS.length;
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(STYLED_PROMPTS[(offset + i) % STYLED_PROMPTS.length]);
    }
    let generated = 0;
    const errors = [];
    for (const p of selected) {
      try {
        const imageDataUri = await gemini.generateTemplateOnly(p.prompt);
        const base64Data = imageDataUri.replace(/^data:[^;]+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        const imageUrl = await uploadTemplateImage(imageBuffer, p.label);
        await db.collection("templates").add({
          emoji: p.emoji,
          label: p.label,
          style: p.style,
          styleName: p.style,
          cat: p.cat,
          prompt: p.prompt,
          image: imageUrl,
          isTrending: false,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          status: "published",
          generatedDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        generated++;
      } catch (e) {
        errors.push(`${p.label}: ${String(e)}`);
      }
    }
    res.json({ ok: true, generated, errors: errors.length ? errors : null });
  } catch (e) {
    next(e);
  }
});
router8.post("/generate", async (_req, res, next) => {
  try {
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const runRef = db.collection("generationRuns").doc(`${date}-manual-${Date.now()}`);
    await runRef.set({
      date,
      status: "pending",
      templatesGenerated: 0,
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      triggeredBy: "admin"
    });
    await runGeneration(date, runRef);
    const snap = await runRef.get();
    const runData = snap.data();
    res.json({
      ok: true,
      date,
      status: runData["status"],
      templatesGenerated: runData["templatesGenerated"] ?? 0,
      errors: runData["errors"] ?? null,
      error: runData["error"] ?? null
    });
  } catch (e) {
    next(e);
  }
});
router8.post("/users/grant-credits", async (req, res, next) => {
  try {
    const { email, credits } = req.body;
    if (!email || !credits || credits < 1) {
      throw new AppError("BAD_REQUEST", "email and credits (>0) required", 400);
    }
    const snap = await db.collection("users").where("email", "==", email.toLowerCase().trim()).limit(1).get();
    if (snap.empty) {
      throw new AppError("NOT_FOUND", `User not found: ${email}`, 404);
    }
    const doc = snap.docs[0];
    const current = doc.data()["generationsUsed"] ?? 0;
    const newUsed = Math.max(0, current - credits);
    await doc.ref.update({ generationsUsed: newUsed, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ ok: true, email, before: current, after: newUsed, granted: credits });
  } catch (e) {
    next(e);
  }
});
var admin_default = router8;

// apps/api/src/index.ts
var app = (0, import_express10.default)();
var allowedOrigins = [
  process.env["APP_BASE_URL"] ?? "http://localhost:5173",
  "http://localhost:5173"
];
app.use((req, res, next) => {
  const origin = req.headers.origin ?? "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use((0, import_pino_http.default)({ logger }));
app.use("/api/webhooks", webhooks_default);
app.use(import_express10.default.json({ limit: "20mb" }));
app.use("/api/users", users_default);
app.use("/api/me", (req, res, next) => {
  req.url = "/me" + req.url;
  users_default(req, res, next);
});
app.use("/api/templates", templates_default);
app.use("/api/billing", billing_default);
app.use("/api/generate", generate_default);
app.use("/api/generate-template", generateTemplate_default);
app.use("/api/cron", cron_default);
app.use("/api/admin", admin_default);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use(errorHandler);
var PORT = process.env["PORT"] ?? 3001;
if (!process.env["VERCEL"] && process.env["NODE_ENV"] !== "test") {
  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`);
  });
}
var index_default = app;
