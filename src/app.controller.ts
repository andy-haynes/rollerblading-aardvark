import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { AccessKeyList } from 'near-api-js/lib/providers/provider';
import { PublicKey } from 'near-api-js/lib/utils/key_pair';

interface AuthSignature {
  accountId: string;
  publicKey: string;
  signedTimestamp: string;
  timestamp: string;
}

interface Profile {
  age?: number;
  astrological_sign?: number;
  birthday?: string;
  education?: string;
  favoriteJohnCarpenterMovie?: string;
  gender?: string;
  income?: number;
  preferred_wallet?: string;
  preffered_crypto?: string;
  preffered_nft_marketplace?: string;
  profession?: string;
}

interface CreateQueryRequest {
  attributes: Array<{ key: string; value: string }>;
  authSignature: AuthSignature;
  totalAccounts: number;
}

interface ViewResultsRequest {
  authSignature: AuthSignature;
  organizationId: string;
  queryId: string;
}

interface RegisterConsumerRequest {
  name: string;
  contractId: string;
  publicKey: string;
  signedTx: string;
}

interface RegisterProducerRequest {
  accountId: string;
  authSignature: AuthSignature;
  profile: Profile;
}

async function authenticate(authSignature: AuthSignature) {
  if (
    !PublicKey.fromString(authSignature.publicKey).verify(
      Buffer.from(authSignature.timestamp),
      Buffer.from(authSignature.signedTimestamp),
    )
  ) {
    return false;
  }

  const provider = new JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' });
  const accessKeys = await provider.query<AccessKeyList>({
    request_type: 'view_access_key_list',
    account_id: authSignature.accountId,
    finality: 'optimistic',
  });

  return accessKeys.keys.some(
    ({ public_key }) => public_key === authSignature.publicKey,
  );
}

@Controller()
export class AppController {
  @Get('test')
  test() {
    return authenticate({
      accountId: 'gornt.testnet',
      publicKey: 'ed25519:FXjeN4RgsWVAiRkkKfk67ztpj3VmRRfRB65BJoou8uDG',
      signedTimestamp: '111',
      timestamp: '111',
    });
  }

  @Get('consumer/:organizationId')
  getConsumer(@Param('organizationId') organizationId: string) {
    return {
      organizationId,
    };
  }

  @Post('consumer')
  registerConsumer(@Body() consumer: RegisterConsumerRequest) {
    return {
      organizationId: `${consumer.name}-123`,
      transactionId: '4yRSZ11rrEVGYwoE99LFN9VKPtU3Mz9owr8JxwtJ9mjN',
      balance: 100,
    };
  }

  @Post('consumer/:organizationId/query')
  createQuery(@Body() query: CreateQueryRequest) {
    return {
      estimatedCost: Math.random() * 10000,
      queryId: Math.floor(Math.random() * 10000 * query.totalAccounts),
    };
  }

  @Post('consumer/:organizationId/results/:queryId')
  viewResults(@Body() viewResults: ViewResultsRequest) {
    return {
      cost: Math.random() * 10000,
      results: [],
    };
  }

  @Post('producer')
  registerProducer(@Body() producer: RegisterProducerRequest) {
    return {
      accountId: producer.accountId,
    };
  }
}
