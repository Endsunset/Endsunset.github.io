# Activities

Plan one round of work, follow it, and keep its history.

## Create an Activity

Only the Project owner can create an Activity.

1. Open your Project, then Activities.
2. Tap Activity Actions (the ellipsis), then Add Activity.
3. Enter a name. Leave Copy set to None to start with an empty plan.
4. Tap Save.

The Activity begins in Planning. Add <doc:Routes-and-Stops> and <doc:Assignments> before starting. In a Planning Activity, open More → Edit to change its name, then Save.

## Know what each state allows

| State | Plan | Item transfers and Stop updates | Review |
| --- | --- | --- | --- |
| Planning | Edit the name, Routes, Stop order, and Assignments with Activity edit access. | Unavailable. | Read the planned work. |
| Active | Locked. | Available with Activity edit access. | Read saved progress, resources, history, and reports. |
| Ended | Read-only. | Read-only. | Read final results, graphs, history, and reports. |

Only the Project owner can create, start, or end an Activity. The state moves forward from Planning to Active to Ended and cannot move backward. A Project can have several Planning or Active Activities at once. Project-owned Locations and Item definitions remain independent of these state locks.

## Reuse an earlier plan

When creating a new Activity, use Copy to choose what to bring from a Source Activity in the same Project:

- **None:** Start without Routes or Assignments.
- **All Routes:** Copy the Routes and Stop order, leaving the Routes unassigned.
- **All Routes and Assignments:** Also copy the Assignments and their Route connections.

You can choose a Source Activity in any state. Copied Stops start with Served set to zero; Supply, transfers, and delivery quantities are not copied. Copy is available when creating an Activity. If the source cannot be copied, correct the problem shown by the app or create without copying.

## Start an Activity

While the Activity is in Planning, check its Routes and Assignments. The owner can then open More, tap Start, and confirm Start.

Starting cannot be undone. It locks the Activity name, planned Routes, Stop order, and Assignments, and revokes the Activity's current sharing invitation. It does not create a replacement invitation. The owner must use Start Sharing and invite people to the active Activity again; see <doc:Sharing>.

## Open active work

Open the active Activity, tap Assignments, and choose an Assignment. Tap Routes and choose a Route to see its Stops. The map follows the work open in the Console.

Use Record Item Transfers on the Activity to record Supply and allocate Items to teams. Use the same action on an Assignment for returns or transfers to another team. See <doc:Item-Transfers>. At a Route, record Served and Item quantities at its Stops; see <doc:Routes-and-Stops>.

## End an Activity

Finish each Route edit and wait for its automatic save to be confirmed. Check remaining Activity and Assignment resources and record any returns or transfers needed. Nonzero balances do not prevent ending, but you cannot change them afterward.

In the active Activity, the owner taps More, then End Activity, reviews the reminder, and confirms End.

Ending cannot be undone. The Activity becomes read-only, its history is preserved, and existing collaborators lose access to that Activity. The Project and its Locations remain available for your next Activity.

Use Start Sharing to give people new view-only access to the ended history. See <doc:Results-and-Reports> to review final results.
