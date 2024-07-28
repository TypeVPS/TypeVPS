import lang from "@/lang";
import { CreateSubPage } from "./base";
import { trpc } from "@/trpc";
import { LiveLogsButton } from "@/components/LiveLogsButton";
import { Button, Typography } from "@suid/material";
import { Link } from "@solidjs/router";
import { createMemo } from "solid-js";

const VPSDeletePage = CreateSubPage((props) => {
    const deleteVmMutation = trpc.vmInstall.delete.useMutation();
    const canDeleteVps = createMemo(() => {
        return props.vm.product.installStatus !== 'AWAITING_CONFIG';
    });

    return (
        <>
            {canDeleteVps() && <>
                <Typography variant="h2">{lang.t.deleteVM()}</Typography>
                <Typography variant="body2" mt={-1}>{lang.t.deleteVMDescription()}</Typography>

                <LiveLogsButton
                    disabled={deleteVmMutation.isSuccess || props.vm.product.installStatus === 'AWAITING_CONFIG'}
                    loading={deleteVmMutation.isLoading}
                    label={lang.t.deleteVM()}
                    liveLogId={
                        deleteVmMutation.data?.liveLogId
                    }
                    onClick={() => {
                        deleteVmMutation.mutate({
                            id: props.vm.id,
                        });
                    }}

                />
            </>}

            {!canDeleteVps() && <>

                <Typography variant="h2">{
                    lang.t.vmIsReadyToConfigure()
                }</Typography>

                <Button variant="contained" href={`/servers/${props.vm.id}/configure`} LinkComponent={Link}>
                    {lang.t.configureVM()}
                </Button>
            </>}
        </>
    );
});

export default VPSDeletePage;
