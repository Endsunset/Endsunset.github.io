# Item Transfers

Record Supply, give Items to teams, and return or transfer their remaining quantities.

Create <doc:Items> in the Project first. Transfers require an Active Activity and permission to edit that Activity. Planning and Ended Activities are read-only for resources.

## Choose where to record a movement

Open the Project's Activities, choose the active Activity, then use Record Item Transfers in the Activity or Assignment details. If you are in a Resources screen, use the same action there.

| Open record | Action | Movement |
| --- | --- | --- |
| Activity | Supply | Add Items from outside the Activity to its available quantity. |
| Activity | Transfer | Move Items from the Activity to one of its Assignments. |
| Assignment | Return | Move remaining Items back to its Activity. |
| Assignment | Transfer | Move Items to another Assignment in the same Activity. |

Use a Route's Stop fields to record deliveries. Routes have no separate stock balance. See <doc:Routes-and-Stops>.

## Record Supply and allocate it to an Assignment

1. Open the active Activity and tap Record Item Transfers.
2. Tap New Record, choose an Item, then choose Supply under Select Action.
3. Enter a positive Quantity and tap Add. This stages the record; it has not been saved yet.
4. Tap New Record again, choose the Item, then choose Transfer.
5. Choose the destination Assignment under To, enter a Quantity, and tap Add.
6. Repeat for other Items or Assignments. Finish or cancel the open editor before continuing.
7. Tap Review. Check each Item, quantity, From, and To.
8. Tap Save and wait for confirmation and the updated Resources display.

Cancel at the top closes the workflow without saving its staged batch. Cancel inside a New Record or quantity editor cancels only that edit.

For example, Supply 100 Water bottles and transfer 30 to Team A. After saving, the Activity has 70 available and Team A has 30. Delivering 12 at Team A's Stops leaves 18 with Team A.

## Stay within the available quantity

Limit to Available Quantity is on by default in the Activity workflow. It includes Supply staged in the same batch. Reduce an allocation or add the Supply you actually received if there is a shortage.

If you turn the limit off and enter an excessive allocation, review Suggested Supply Adjustment. Update accepts both the allocation and the proposed Supply quantity; Cancel leaves Supply unchanged. Accept it only when it matches the Items actually supplied. Turning the limit off does not save a shortage by itself.

Assignment returns and outgoing transfers must stay within that Assignment's combined available balance. Items already delivered at Stops are no longer available to transfer.

## Return Items or transfer them between teams

1. Open the active Activity, then Assignments, and choose the Assignment holding the Items.
2. Tap Record Item Transfers, then New Record.
3. Choose the Item and select Return to send it to the Activity, or Transfer to choose another Assignment.
4. Enter the positive Quantity and tap Add.
5. Tap Review, check the endpoints and quantities, then Save.

Only other Assignments in this Activity are offered as destinations. To supply a different Activity, open that Activity and record its own Supply.

## Correct a staged record

Before saving, tap a staged row to change its Quantity, then tap Update. Cancel restores the previous draft quantity. Delete removes the staged row; setting it to zero asks you to confirm removal. To change the Item, action, or destination, remove the row and add a new one.

Each batch can contain at most 80 records, including Supply. Use one row for each Item and movement between the same endpoints; edit its quantity instead of adding a duplicate.

## Read saved history

Open History under Item Transfer History, or read the history rows shown in the detail. Each entry identifies the Item, quantity, direction, and Recorded On date and time. No Transfers Recorded means there are no saved movements in that view.

Saved history is read-only. The staged-row editor changes unsaved rows only. Record a new return or transfer for a real reverse movement; correct Stop deliveries through their Stop fields.

## If Review or Save is unavailable

Finish the current New Record or quantity editor, choose all required values, and resolve shortages. If saving fails, the workflow keeps your staged values so you can correct them and Review again. Check the current balances, permissions, and Activity status before retrying. If the owner has ended the Activity, further resource changes cannot be saved.
