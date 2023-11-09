# SequenceProcessor

SequenceProcessor processes a SequenceDefinition to update the provided state.

A SequenceDefinition is composed of a sequence of steps that are mapped to a state attribute.

The SequenceProcessor evaluates each step in the order specified by the SequenceDefinition.

Each step contains of one or more step functions.

The result from the evaluation of each step function is assigned to the state attribute it is mapped to.

Each step function is provided the full readonly state (non-mutable) from the preceding step or step function (or the initial state for the first step function of the first step).

Configuration at the level of the SequenceProcessor or that of individual steps determines:
- How errors thrown by a step are handled
- What to do when an attribute to be evaluated by a step already has a value
- What to do when an attribute to be evaluated by a function in a step function array already has a value

## Scripts

### Run tests

```sh
$ npm run test
```

### Validate types 

```sh
$ npm run typecheck
```

### Run code analysis and apply fixes

```sh
$ npm run lint
```

### Run code analysis 

```sh
$ npm run lint:check
```


