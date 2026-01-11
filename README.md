# @raphiiko/wavelink-cli

A command-line interface for controlling Elgato Wave Link 3.0.

> **Note:** This CLI is based on Wave Link 3.0 Beta Update 3. Keep in mind things might break with future Wave Link updates.

## Prerequisites

- **Elgato Wave Link 3.0** (Beta Update 3 or newer) must be installed and running.
- **Node.js 18+** or **Bun 1.0+**

## Installation

Run directly with `npx`:

```bash
npx @raphiiko/wavelink-cli <category> <command> [options]
```

Or install globally:

```bash
npm install -g @raphiiko/wavelink-cli
# or
bun add -g @raphiiko/wavelink-cli
```

## Usage

```bash
wavelink-cli <category> <command> [options]
```

### Output Devices
Manage your output devices (Headphones, Speakers, etc).

```bash
# List all output devices
wavelink-cli output list

# Assign an output device to a mix
wavelink-cli output assign <output-id> <mix-id-or-name>

# Remove an output device from its mix
wavelink-cli output unassign <output-id>

# Set volume (0-100)
wavelink-cli output set-volume <output-id> <volume>

# Mute/Unmute
wavelink-cli output mute <output-id>
wavelink-cli output unmute <output-id>
```

### Mixes
Control your mixes (Stream Mix, Monitor Mix).

```bash
# List all mixes
wavelink-cli mix list

# Set a device as the ONLY output for a mix
wavelink-cli mix set-output <mix-id-or-name> <output-id>

# Set master volume (0-100)
wavelink-cli mix set-volume <mix-id-or-name> <volume>

# Mute/Unmute/Toggle
wavelink-cli mix mute <mix-id-or-name>
wavelink-cli mix unmute <mix-id-or-name>
wavelink-cli mix toggle-mute <mix-id-or-name>
```

### Channels
Manage audio channels (System, Music, Browser, etc).

```bash
# List all channels
wavelink-cli channel list

# Set master channel volume (0-100)
wavelink-cli channel set-volume <channel-id> <volume>

# Mute/Unmute/Toggle channel globally
wavelink-cli channel mute <channel-id>
wavelink-cli channel unmute <channel-id>
wavelink-cli channel toggle-mute <channel-id>

# Set volume for a specific mix
wavelink-cli channel set-mix-volume <channel-id> <mix-id-or-name> <volume>

# Mute/Unmute in a specific mix
wavelink-cli channel mute-in-mix <channel-id> <mix-id-or-name>
wavelink-cli channel unmute-in-mix <channel-id> <mix-id-or-name>

# Add an application to a channel
wavelink-cli channel add-app <channel-id> <app-name>
```

### Inputs
Control hardware inputs (Microphones, etc).

```bash
# List all input devices
wavelink-cli input list

# Set gain (0-100)
wavelink-cli input set-gain <input-id> <gain>

# Mute/Unmute
wavelink-cli input mute <input-id>
wavelink-cli input unmute <input-id>
```

### General

```bash
# Show Wave Link application info
wavelink-cli info
```

## License

MIT
