use {
    std::convert::TryInto,
    solana_program::{
        account_info::{
            next_account_info, AccountInfo
        },
        entrypoint,
        entrypoint::ProgramResult,
        msg,
        program::invoke,
        program_error::ProgramError,
        pubkey::Pubkey,
        system_instruction,
    },
};


entrypoint!(process_instruction);


pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    
    let accounts_iter = &mut accounts.iter();
     //* ?: shorthand for the type, Result
    let payer = next_account_info(accounts_iter)?;
    let payee = next_account_info(accounts_iter)?;
    //* deserialize an serialized integer from buffer into a byte array
    let amount = input
        .get(..8) //* web3.js에서 8 byte로 설정함
        .and_then(|slice| slice.try_into().ok())
        .map(u64::from_le_bytes)
        .ok_or(ProgramError::InvalidInstructionData)?;


    msg!("Received request to transfer {:?} lamports from {:?} to {:?}.", 
        amount, payer.key, payee.key);
    msg!("  Processing transfer...");
    
    //* Invoke a cross-program instruction
    // one program invoking an instruction of the other, system program in this case
    // param1: instruction, param2: account_infos
    invoke(
        &system_instruction::transfer(payer.key, payee.key, amount),
        &[payer.clone(), payee.clone()],
    )?;
    
    msg!("Transfer completed successfully.");
    Ok(())
}