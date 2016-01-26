# Grunt-config-dist
Grunt task to update a json configuration from an other. Adds what's missing. Warns about what to remove.

## Usage
Grunt configDist task is a grunt multi task. Each task config has the following properties:
```
{
    own: './config.json', // path to the config file you will use which and don't commit
    dist: './config.json.dist' // path to the config file which is used to create/update your own config file
}
```
