# ARCHIVED

This repository has been archived. After many months of trying to make Elgato's Wave Link work reliably for me, I gave up and switched to a different software audio mixer, and so this repository will not be updated any further.

# @raphiiko/wavelink-cli

[![npm version](https://img.shields.io/npm/v/@raphiiko/wavelink-cli.svg)](https://www.npmjs.com/package/@raphiiko/wavelink-cli)
[![npm downloads](https://img.shields.io/npm/dm/@raphiiko/wavelink-cli.svg)](https://www.npmjs.com/package/@raphiiko/wavelink-cli)
[![license](https://img.shields.io/npm/l/@raphiiko/wavelink-cli.svg)](https://github.com/Raphiiko/wavelink-cli/blob/main/LICENSE)

A command-line interface for controlling Elgato Wave Link 3.

> **Note:** This CLI targets Wave Link **3.1.1 (build 3113)**, reverse engineered from Stream Deck plugin v3.0.2.290. Keep in mind things might break with future Wave Link updates.

## Prerequisites

- **Elgato Wave Link 3.1** (or newer) must be installed and running.
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
# List all output devices (shows names, IDs, device type, and current mix)
wavelink-cli output list

# Assign an output device to a mix (use ID or name)
wavelink-cli output assign <output-id-or-name> <mix-id-or-name>
# Example: wavelink-cli output assign "Headphones (Arctis Nova Pro Wireless)" "Stream Mix"

# Remove an output device from its mix
wavelink-cli output unassign <output-id-or-name>
# Example: wavelink-cli output unassign "Speakers (Realtek)"

# Set the main output device
wavelink-cli output set-main <output-id-or-name>
# Example: wavelink-cli output set-main "Speakers (Realtek)"

# Set volume (0-100)
wavelink-cli output set-volume <output-id-or-name> <volume>
# Example: wavelink-cli output set-volume "Headphones (Arctis Nova Pro Wireless)" 75

# Mute/Unmute
wavelink-cli output mute <output-id-or-name>
wavelink-cli output unmute <output-id-or-name>
wavelink-cli output toggle-mute <output-id-or-name>
# Example: wavelink-cli output toggle-mute "Speakers (Realtek)"
```

### Mixes
Control your mixes (Stream Mix, Monitor Mix).

```bash
# List all mixes
wavelink-cli mix list

# Set a device as the ONLY output for a mix
wavelink-cli mix set-output <mix-id-or-name> <output-id>
# Example: wavelink-cli mix set-output "Stream Mix" "{0.0.0.00000000}.{abc12345-...}"

# Set master volume (0-100)
wavelink-cli mix set-volume <mix-id-or-name> <volume>
# Example: wavelink-cli mix set-volume "Personal Mix" 80

# Mute/Unmute/Toggle
wavelink-cli mix mute <mix-id-or-name>
wavelink-cli mix unmute <mix-id-or-name>
wavelink-cli mix toggle-mute <mix-id-or-name>
# Example: wavelink-cli mix toggle-mute "Monitor Mix"
```

### Channels
Manage audio channels (System, Music, Browser, etc).

```bash
# List all channels (shows names and IDs)
wavelink-cli channel list

# Set master channel volume (0-100, use ID or name)
wavelink-cli channel set-volume <channel-id-or-name> <volume>
# Example: wavelink-cli channel set-volume "Game Audio" 70

# Mute/Unmute/Toggle channel globally
wavelink-cli channel mute <channel-id-or-name>
wavelink-cli channel unmute <channel-id-or-name>
wavelink-cli channel toggle-mute <channel-id-or-name>
# Example: wavelink-cli channel toggle-mute "Voice Chat"

# Set volume for a specific mix
wavelink-cli channel set-mix-volume <channel-id-or-name> <mix-id-or-name> <volume>
# Example: wavelink-cli channel set-mix-volume browser "Stream Mix" 60

# Mute/Unmute in a specific mix
wavelink-cli channel mute-in-mix <channel-id-or-name> <mix-id-or-name>
wavelink-cli channel unmute-in-mix <channel-id-or-name> <mix-id-or-name>
wavelink-cli channel toggle-mute-in-mix <channel-id-or-name> <mix-id-or-name>
# Example: wavelink-cli channel toggle-mute-in-mix game "Monitor Mix"

# Isolate a channel in a mix (mute all others)
wavelink-cli channel isolate <channel-id-or-name> <mix-id-or-name>
# Example: wavelink-cli channel isolate voice "Personal Mix"

# Enable/disable an effect on a channel (e.g. Elgato EQ)
wavelink-cli channel effect <channel-id-or-name> <effect-id-or-name> <on|off>
# Example: wavelink-cli channel effect "Music" "Elgato EQ" off

# Route an application to a channel
wavelink-cli channel add-app <app-id> <channel-id-or-name>
# Example: wavelink-cli channel add-app com.spotify.music "Music"
```

### Inputs
Control hardware inputs (Microphones, etc).

```bash
# List all input devices (shows names, IDs, device type, gain ranges, mic/PC mix, and effects)
wavelink-cli input list

# Set gain (0-100, use ID or name)
wavelink-cli input set-gain <input-id-or-name> <gain>
# Example: wavelink-cli input set-gain "Microphone (Blue Yeti)" 65

# Set the Mic/PC balance (0-100, Elgato Wave devices only)
wavelink-cli input set-mic-pc-mix <input-id-or-name> <value>
# Example: wavelink-cli input set-mic-pc-mix "Wave:3" 50

# Enable/disable an effect on an input (Elgato Wave devices only; covers software and DSP effects)
wavelink-cli input effect <input-id-or-name> <effect-id-or-name> <on|off>
# Example: wavelink-cli input effect "Wave:3" "Clipguard" on

# Mute/Unmute
wavelink-cli input mute <input-id-or-name>
wavelink-cli input unmute <input-id-or-name>
wavelink-cli input toggle-mute <input-id-or-name>
# Example: wavelink-cli input toggle-mute "Wave:3"
```

### Monitor
Watch Wave Link events in real time. These commands run until you press `Ctrl+C`.

```bash
# Watch device, channel, and mix change notifications
wavelink-cli monitor changes

# Watch focused-application changes (auto-switching context)
wavelink-cli monitor focus

# Watch level-meter values for an input, output, channel, or mix
wavelink-cli monitor levels <input|output|channel|mix> <id-or-name>
# Example: wavelink-cli monitor levels channel "Music"
```

### General

```bash
# Show Wave Link application info (name, version, build, OS)
wavelink-cli info
```

## License

MIT

## Disclaimer

This is an unofficial library and is not affiliated with or endorsed by Elgato or Corsair.
