type Claims = {
    role: string
}

interface OperationBase {
    id: string | undefined,
    date: string | Date,
    account: string | DbItem,
    description: string,
    sum: number,
    tags: string[]
}

interface SaveOperationInput extends OperationBase{
    date: string,
    group: string,
    account: string,
}

interface Operation extends OperationBase{
    id: string,
    date: Date,
    account: DbItem,
    user: string,
    created: Date,
}

type DeleteOperationInput = {
    id: number
}

type PostOperationInput = {
    postAsSingle: boolean,
    ids: Array<string>
}

type RevertOperationInput = {
    docNumber: number
}

interface PostedOperation extends OperationBase{
    account: DbItem,
    currency: DbItem,
    date: Date,
    balance: number,
    docNumber: number,
    equivalent: number,
    rate: number,
    created: Date,
    isReverted?: boolean,
    isRevertOperation?: boolean
}

interface ReportOperation extends OperationBase{
    isReverted?: boolean,
    isRevertOperation?: boolean
}

type Entity = "group" | "tag" | "account" | "rate" |
    "user" | "currency" | "posted" | "operation";

type ROLE = "ADMIN" | "BOOKER";

type DbItem = {
    id: string,
    name: string,
    kind: string,
}

type User = {
    email: string,
    role: ROLE
}

type RunQueryError = {
    code: number,
    details: string
}

type SaveGroupInput = {
    name: string,
    tags: string[]
}

type DeleteGroupInput = {
    name: string
}

type GetCurrencyRateInput = {
    currency: string
}

type GetCurrencyRateResult = {
    rate: number,
    date: Date
}

type AddCurrencyRateInput = {
    currency: string,
    rate: number,
    date: string,
}

type SaveAccountInput = {
    accountName: string,
    currency: string,
    blocked: number,
    isActive: boolean
}

type GetAccountBalanceInput = {
    accountName: string
}

type Account = {
    currency: DbItem,
    isActive: boolean,
    blocked: number,
}

type ReportRow = {
    date: Date | null,
    sum: number,
    description: string,
    tags: string[]
}
