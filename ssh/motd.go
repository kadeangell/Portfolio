package main

import "strings"

const (
	reset = "\x1b[0m"
	bold  = "\x1b[1m"
	dim   = "\x1b[2m"
	green = "\x1b[32m"
	cyan  = "\x1b[36m"
	white = "\x1b[37m"
)

// Same logo and copy as src/terminal/bashrc.ts
var logo = []string{
	` _  __          _      `,
	`| |/ /__ _  __| | ___ `,
	`| ' // _` + "`" + ` |/ _` + "`" + ` |/ _ \`,
	`| . \ (_| | (_| |  __/`,
	`|_|\_\__,_|\__,_|\___|`,
}

func motd() string {
	var b strings.Builder
	b.WriteString("\n")
	for _, l := range logo {
		b.WriteString("  " + cyan + l + reset + "\n")
	}
	b.WriteString("\n")
	b.WriteString("  " + bold + white + "kade angell" + reset + dim + " — software engineer" + reset + "\n\n")
	b.WriteString("  " + dim + white + "type " + reset + green + "help" + reset + dim + white + " for available commands" + reset + "\n\n")
	return b.String()
}
