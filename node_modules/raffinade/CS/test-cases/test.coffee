
import { u, cl, aprodec, join } from './raffinade.js'


arr0 = ->
    yield from [1, 2]

arr0 = arr0 u


fc = (arg) ->
    arg .reduce (acc, itm) -> acc * itm

cl '# ' + join ', ', (i for await i from aprodec fc, arr0, [3, 4], [5, 6,])

# 15, 18, 20, 24, 30, 36, 40, 48




###
interval = [1, 10]

g1 = asyncrange3 ...interval
g2 = asyncrange3 ...[2, 8]

cl i for i  from enamerate g1
###
