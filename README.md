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
# List all output devices (shows names, IDs, and Wave Device status)
wavelink-cli output list

# Assign an output device to a mix (use ID or name)
wavelink-cli output assign <output-id-or-name> <mix-id-or-name>
# Example: wavelink-cli output assign "Headphones (Arctis Nova Pro Wireless)" "Stream Mix"

# Remove an output device from its mix
wavelink-cli output unassign <output-id-or-name>
# Example: wavelink-cli output unassign "Speakers (Realtek)"

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
```

### Inputs
Control hardware inputs (Microphones, etc).

```bash
# List all input devices (shows names, IDs, gain ranges, gain lock status, and mic/PC mix settings)
wavelink-cli input list

# Set gain (0-100, use ID or name)
wavelink-cli input set-gain <input-id-or-name> <gain>
# Example: wavelink-cli input set-gain "Microphone (Blue Yeti)" 65

# Mute/Unmute
wavelink-cli input mute <input-id-or-name>
wavelink-cli input unmute <input-id-or-name>
wavelink-cli input toggle-mute <input-id-or-name>
# Example: wavelink-cli input toggle-mute "Wave:3"
```

### General

```bash
# Show Wave Link application info
wavelink-cli info
```

## License

MIT

## Disclaimer

This is an unofficial library and is not affiliated with or endorsed by Elgato or Corsair.