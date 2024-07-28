import { useSearchParams } from "@solidjs/router"
import { createContext, useContext, JSX } from "solid-js"
import { ExtendUserServiceDialog } from "./ExtendExisting"
import { BuyNewDialog } from "./BuyNew"

export const BuyContext = createContext<{
    openBuyNewProductModal: (productId: string) => void
    openExtendUserServiceDialog: (userServiceId: string, autoRenew: boolean) => void
}>()

export const BuyContextProvider = (props: { children: JSX.Element }) => {
    const [searchParams, setSearchParams] = useSearchParams()

    const openBuyNewProductModal = (productId: string) => {
        setSearchParams({
            buyProductId: productId
        })
    }

    const openExtendUserServiceDialog = (userServiceId: string, autoRenew: boolean) => {
        setSearchParams({
            extendUserPaidServiceId: userServiceId
        })
    }

    return (<BuyContext.Provider value={{
        openBuyNewProductModal,
        openExtendUserServiceDialog
    }}>
        <>
            <BuyNewDialog />
            <ExtendUserServiceDialog />

            {props.children}
        </>
    </BuyContext.Provider>)
}

export const useBuyContext = () => {
    const context = useContext(BuyContext)
    if (!context) {
        throw new Error("useBuy must be used within a BuyProvider")
    }
    return context
}