emcc --bind -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s 'EXPORT_NAME="createMyModule"' -o ant_colony.js ant-colony.cpp 
