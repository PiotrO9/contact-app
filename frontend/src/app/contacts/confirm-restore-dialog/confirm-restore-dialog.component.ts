import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export type ConfirmRestoreDialogData = {
  contactName: string;
};

@Component({
  selector: 'app-confirm-restore-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-restore-dialog.component.html',
  styleUrl: './confirm-restore-dialog.component.scss',
})
export class ConfirmRestoreDialogComponent {
  protected readonly data = inject<ConfirmRestoreDialogData>(MAT_DIALOG_DATA);
}
