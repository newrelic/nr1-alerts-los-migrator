## Usage

### Overview
New Relic has released native loss of signal detection on Oct 5, 202o. To date, many customers have accomplished loss of signal style checks using NRQL-based conditions. When native support goes live, these NRQL-based conditions may no longer work as expected. To avoid this outcome, customers are very strongly encouraged to update existing, NRLQ-based loss of signal conditions to use the native loss of signal feature. This app is designed to facilitate that migration process.

### Migrating Conditions
Loss of Signal Migrator locates all alerts that are likely candidates for migration and makes them avialable for updating. An alert is considered a likely candidate for migration if: 

1. it is a static NRQL-based alert (not a baseline or outlier condition)
2. it uses an EQUALS or BELOW threshold evaluator
3. if EQUALS, the value being evaluated is 0
   
Migration candidates are presented in tabular format for easy visual scanning; each candidate can be edited directly in the table to facilitate rapid updates.

Usage is very simple: select one or more conditions to update, edit the loss of signal and gap filling fields as needed, and hit update.

### What do the Loss of Signal and Gap Filling fields mean?
You can more information about the Loss of Signal and Gap Filling features [in the New Relic docs](https://docs.newrelic.com/docs/alerts-applied-intelligence/new-relic-alerts/alerts-nerdgraph/nerdgraph-api-loss-signal-gap-filling).

### What are Suggestions?
Suggestions offer the simplest way to migrate existing conditions - clicking "Auto-fill Conditions" will autotomatically fill the Loss of Signal and Gap Filling fields with defaults that will closely mimic the current behaviour of the condition. Suggestion logic is applied as follows:

Loss of Signal
1. `duration = current critical threshold duration * evaluation offset (in seconds)`
2. `close violations = false`
3. `open violation = true`

Gap Filling Strategy
1. `fill option = NONE`

## Open Source License

This project is distributed under the [Apache 2 license](https://github.com/newrelic/nr1-alerts-los-migrator/blob/main/LICENSE).

## What do you need to make this work?

1. [New Relic One](https://newrelic.com/platform)

## Community Support

New Relic hosts and moderates an online forum where you can interact with New Relic employees as well as other customers to get help and share best practices. Like all New Relic open source community projects, there's a related topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

[https://discuss.newrelic.com/t/nr1-alerts-los-migrator](https://discuss.newrelic.com/t/nr1-alerts-los-migrator)

Please do not report issues with Loss of Signal Migrator to New Relic Global Technical Support. Instead, visit the [`Explorers Hub`](https://discuss.newrelic.com/t/) for troubleshooting and best-practices.

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](https://github.com/newrelic/nr1-alerts-los-migrator/issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](https://github.com/newrelic/nr1-alerts-los-migrator/blob/main/CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource@newrelic.com.