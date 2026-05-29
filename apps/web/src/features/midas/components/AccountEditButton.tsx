'use client';

import { useState } from 'react';
import { Button } from '@ethos/ui';
import { HugeiconsIcon } from '@hugeicons/react';
import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { EditAccountModal } from '@/features/midas/components/EditAccountModal';
import { getAccounts } from '@/features/midas/actions/accounts';

type Account = Awaited<ReturnType<typeof getAccounts>>[number];

interface Props {
  account: Account;
  workspaceId: string;
}

export function AccountEditButton({ account, workspaceId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <EditAccountModal
        account={account}
        workspaceId={workspaceId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
