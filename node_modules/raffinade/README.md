# Raffinade

Effort to transform CoffeeScript to prefix language. In order to avoid nested constructions and achieving code elegance.

Example issue and approaches to resolve:

```CoffeeScript
# Issue
# Nested construction, cumbersomity

value = (some_function argument)[key]
```

```CoffeeScript
# Approach

### Get property ###
gp = (key, obj) -> obj[key]
```

```CoffeeScript
# Result

value = gp key some_function argument
```


```CoffeeScript
# CS produce code returns lalest expression, altought some time need not this
# return, therefore this code is redundant. Possible to append undefined in
# last line, but this require one line

some_function = ->
    some_code
    undefined

# Looks better idea use prefix function ala JS void operator

v = -> undefined # Kind of JS void

some_function = -> v some_code
```
