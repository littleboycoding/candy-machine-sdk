import { Connection, PublicKey } from "@solana/web3.js";
import { getAll } from "./get";
import { CandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import BN from "bn.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { makeAutoObservable } from "mobx";

/**
 * @description unmintable reason
 */
enum Unmintable {
  ItemNotAvailable,
  InsufficientFund,
  NotLived,
}

/**
 * @description inspect any candy machine, fetch on-chain data, provide helper utilities, automatically watch and update as candy machine updated
 */
class Inspector {
  private subscriptionId: number;

  private constructor(
    public connection: Connection,
    public candyMachineAddress: PublicKey,
    public candyMachineAccount: CandyMachine
  ) {
    makeAutoObservable(this);
    this.subscriptionId = connection.onAccountChange(
      candyMachineAddress,
      (accountInfo) => {
        const [candyMachineAccount] = CandyMachine.fromAccountInfo(accountInfo);
        this.candyMachineAccount = candyMachineAccount;
      }
    );
  }

  /**
   * @description unsubscribe new update of candy machine
   */
  unwatch() {
    this.connection.removeAccountChangeListener(this.subscriptionId);
  }

  /**
   * @description initialize inspector instance from given address
   * @param connection - connection instance
   * @param candyMachineAddress - address of candy machine
   * @returns Inspector instance
   */
  static async fromAddress(
    connection: Connection,
    candyMachineAddress: PublicKey
  ) {
    const candyMachineAccount = await CandyMachine.fromAccountAddress(
      connection,
      candyMachineAddress
    );

    return new this(connection, candyMachineAddress, candyMachineAccount);
  }

  /**
   * @description get all items in candy machine
   * @returns array of items
   */
  get items() {
    return getAll(this.connection, this.candyMachineAddress);
  }

  /**
   * @description get mint price
   * @param isDiscount - boolean to get discounted price (for whitelisted minter)
   * @returns mint price
   */
  price(isDiscount: boolean = false) {
    const price = this.candyMachineAccount.data.price as BN;
    const discount = this.candyMachineAccount.data.whitelistMintSettings
      ?.discountPrice as BN;

    if (!discount) return price;
    if (isDiscount) return price.sub(discount);

    return price;
  }

  /**
   * @description get total available tokens to be mint
   * @returns total available tokens
   */
  get available() {
    return this.candyMachineAccount.data.itemsAvailable;
  }

  /**
   * @description get total redeemed tokens
   * @returns total redeemed tokens
   */
  get redeemed() {
    return this.candyMachineAccount.itemsRedeemed;
  }

  /**
   * @description get total redeemed tokens
   * @returns total redeemed tokens
   */
  get remaining() {
    return (<BN>this.candyMachineAccount.data.itemsAvailable).sub(
      <BN>this.candyMachineAccount.itemsRedeemed
    );
  }

  /**
   * @description get live date
   * @returns date object or null if not already set
   */
  get liveDate() {
    const goLiveDateBn = this.candyMachineAccount.data.goLiveDate;

    return goLiveDateBn instanceof BN
      ? new Date(goLiveDateBn.muln(1000).toNumber())
      : null;
  }
  /**
   * @description is candy machine lived
   * @returns boolean indicate candy machine live status
   */
  isLived(date?: Date) {
    const liveDate = this.liveDate;
    if (!liveDate) return false;

    return (date || new Date()) >= liveDate;
  }

  /**
   * @description validate if minter has sufficient fund
   * @param minter - minter's public key
   * @returns boolean indicate if user has sufficient fund or not
   */
  async isSufficientFund(minter: PublicKey, isDiscount: boolean = false) {
    const price = BigInt(this.price(isDiscount).toString());
    let balance: bigint;

    if (this.candyMachineAccount.tokenMint) {
      balance = await getAccount(
        this.connection,
        await getAssociatedTokenAddress(
          this.candyMachineAccount.tokenMint,
          minter
        )
      ).then((account) => account.amount);
    } else {
      balance = BigInt(await this.connection.getBalance(minter));
    }

    return balance >= price;
  }

  /**
   * @description validate if minter is author of candy machine
   * @param minter - minter's public key
   * @returns boolean indicate if author or not
   */
  isAuthority(minter: PublicKey) {
    return minter.equals(this.candyMachineAccount.authority);
  }

  /**
   * @description validate if minter is whitelisted
   * @param minter - minter's public key
   * @returns boolean indicate if minter is whitelisted or not
   */
  async isWhitelisted(minter: PublicKey) {
    const whitelistMintSettings =
      this.candyMachineAccount.data.whitelistMintSettings;

    if (!whitelistMintSettings) return false;

    const token = await getAssociatedTokenAddress(
      whitelistMintSettings.mint,
      minter
    );
    const balance = await getAccount(this.connection, token).then(
      (account) => account.amount
    );

    if (balance === BigInt(0)) return false;

    return true;
  }

  /**
   * @description validate if given public key can mint, given the condition if candy machine is lived, does minter has whitelist, has sufficient fund, is minter the author of candy machine
   * @param minter - minter's public key
   * @returns [mintable boolean, reason if unmintable]
   * @todo write extensive test
   * @alpha
   */
  async isMintable(minter: PublicKey): Promise<[boolean, Unmintable | null]> {
    const isAvailable = this.remaining.gtn(0);
    if (!isAvailable) return [false, Unmintable.ItemNotAvailable];

    const isWhitelisted = await this.isWhitelisted(minter);

    const isSufficientFund = await this.isSufficientFund(minter, isWhitelisted);
    if (!isSufficientFund) return [false, Unmintable.InsufficientFund];

    if (this.isAuthority(minter)) return [true, null];

    const isPresale =
      this.candyMachineAccount.data.whitelistMintSettings?.presale;
    if (isWhitelisted && isPresale) return [true, null];

    if (!this.isLived()) return [false, Unmintable.NotLived];

    return [true, null];
  }
}

export { Inspector, Unmintable };
