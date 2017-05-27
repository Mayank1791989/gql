/* @flow */
import { Source } from 'graphql';
import TestResolverParser from '../TestResolverParser';

expect.addSnapshotSerializer({
  test: val => val instanceof Source,
  print: val => `Source(${val.name})`,
});

test('parse works', () => {
  const parser = new TestResolverParser();
  const test = parser.parse(
    new Source(
      `
      resolvers[Test/id] = func;
      resolvers[Test/name] = func;
      scalars[STest] = func;
      directives[DTest] = func;
      enumTypes[ETest] = func;
      enumValues[ETest/val] = func;
    `,
      'test.js',
    ),
  );
  expect(test).toMatchInlineSnapshot(`
    Object {
      "kind": "ResolverDocument",
      "resolvers": Array [
        Object {
          "kind": "FieldResolver",
          "loc": Object {
            "end": 32,
            "source": Source(test.js),
            "start": 7,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 24,
              "source": Source(test.js),
              "start": 22,
            },
            "value": "id",
          },
          "type": Object {
            "kind": "Name",
            "loc": Object {
              "end": 21,
              "source": Source(test.js),
              "start": 17,
            },
            "value": "Test",
          },
        },
        Object {
          "kind": "FieldResolver",
          "loc": Object {
            "end": 67,
            "source": Source(test.js),
            "start": 40,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 59,
              "source": Source(test.js),
              "start": 55,
            },
            "value": "name",
          },
          "type": Object {
            "kind": "Name",
            "loc": Object {
              "end": 54,
              "source": Source(test.js),
              "start": 50,
            },
            "value": "Test",
          },
        },
        Object {
          "kind": "ScalarTypeResolver",
          "loc": Object {
            "end": 96,
            "source": Source(test.js),
            "start": 75,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 88,
              "source": Source(test.js),
              "start": 83,
            },
            "value": "STest",
          },
        },
        Object {
          "kind": "DirectiveResolver",
          "loc": Object {
            "end": 128,
            "source": Source(test.js),
            "start": 104,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 120,
              "source": Source(test.js),
              "start": 115,
            },
            "value": "DTest",
          },
        },
        Object {
          "kind": "EnumTypeResolver",
          "loc": Object {
            "end": 159,
            "source": Source(test.js),
            "start": 136,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 151,
              "source": Source(test.js),
              "start": 146,
            },
            "value": "ETest",
          },
        },
        Object {
          "kind": "EnumValueResolver",
          "loc": Object {
            "end": 195,
            "source": Source(test.js),
            "start": 167,
          },
          "name": Object {
            "kind": "Name",
            "loc": Object {
              "end": 187,
              "source": Source(test.js),
              "start": 184,
            },
            "value": "val",
          },
          "type": Object {
            "kind": "Name",
            "loc": Object {
              "end": 183,
              "source": Source(test.js),
              "start": 178,
            },
            "value": "ETest",
          },
        },
      ],
    }
  `);
});
